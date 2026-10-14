import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_path: str = "data/energy_forecasting.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Forecast history
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecast_history (
                id TEXT PRIMARY KEY,
                model_name TEXT NOT NULL,
                horizon_hours INTEGER NOT NULL,
                peak_power_kw REAL NOT NULL,
                peak_timestamp TEXT NOT NULL,
                training_range_start TEXT,
                training_range_end TEXT,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """)

            # Model evaluation metrics
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_metrics (
                id TEXT PRIMARY KEY,
                model_name TEXT NOT NULL,
                mae REAL NOT NULL,
                rmse REAL NOT NULL,
                mape REAL NOT NULL,
                wape REAL NOT NULL,
                sample_count INTEGER NOT NULL,
                target_achieved INTEGER NOT NULL,
                evaluation_period_start TEXT,
                evaluation_period_end TEXT,
                details_json TEXT,
                created_at TEXT NOT NULL
            )
            """)

            # Pipeline execution logs
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_jobs (
                id TEXT PRIMARY KEY,
                state TEXT NOT NULL,
                messages_produced INTEGER DEFAULT 0,
                messages_consumed INTEGER DEFAULT 0,
                valid_records INTEGER DEFAULT 0,
                rejected_records INTEGER DEFAULT 0,
                last_processed_timestamp TEXT,
                speed REAL DEFAULT 1.0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """)

            # App configuration
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """)
            conn.commit()

    def save_forecast(self, forecast_id: str, model_name: str, horizon: int, peak_kw: float,
                      peak_time: str, train_start: str, train_end: str, payload: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO forecast_history 
            (id, model_name, horizon_hours, peak_power_kw, peak_timestamp, training_range_start, training_range_end, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                forecast_id, model_name, horizon, peak_kw, peak_time, train_start, train_end,
                json.dumps(payload), datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_latest_forecast(self) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT payload_json FROM forecast_history ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                return json.loads(row["payload_json"])
            return None

    def get_forecast_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT payload_json FROM forecast_history ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [json.loads(row["payload_json"]) for row in rows]

    def save_metrics(self, model_name: str, metrics: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            metric_id = f"{model_name}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            cursor.execute("""
            INSERT INTO model_metrics
            (id, model_name, mae, rmse, mape, wape, sample_count, target_achieved, evaluation_period_start, evaluation_period_end, details_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metric_id, model_name, metrics.get("mae", 0.0), metrics.get("rmse", 0.0),
                metrics.get("mape", 0.0), metrics.get("wape", 0.0), metrics.get("sample_count", 0),
                1 if metrics.get("target_achieved", False) else 0,
                metrics.get("evaluation_period", {}).get("start", ""),
                metrics.get("evaluation_period", {}).get("end", ""),
                json.dumps(metrics),
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_latest_metrics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT model_name, details_json FROM model_metrics ORDER BY created_at DESC")
            rows = cursor.fetchall()
            result = {}
            for row in rows:
                if row["model_name"] not in result:
                    result[row["model_name"]] = json.loads(row["details_json"])
            return result

db_manager = DatabaseManager()

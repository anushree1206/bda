import os
import json
from datetime import datetime
from typing import List, Dict, Any
from backend.app.storage.base import StorageAdapter

class LocalStorageAdapter(StorageAdapter):
    def __init__(self, base_dir: str = "data/energy"):
        self.base_dir = os.path.abspath(base_dir)
        self.raw_dir = os.path.join(self.base_dir, "raw")
        self.processed_dir = os.path.join(self.base_dir, "processed", "hourly")
        self.forecasts_dir = os.path.join(self.base_dir, "forecasts")
        self.metrics_dir = os.path.join(self.base_dir, "model-metrics")

        for d in [self.raw_dir, self.processed_dir, self.forecasts_dir, self.metrics_dir]:
            os.makedirs(d, exist_ok=True)

    def is_available(self) -> bool:
        return os.path.exists(self.base_dir) and os.access(self.base_dir, os.W_OK)

    def save_raw_reading(self, reading: Dict[str, Any]) -> str:
        # Date-partitioned raw storage: raw/YYYY-MM-DD/readings.jsonl
        ts_str = reading.get("timestamp", datetime.utcnow().isoformat())
        date_part = ts_str.split("T")[0] if "T" in ts_str else ts_str.split(" ")[0]
        partition_dir = os.path.join(self.raw_dir, date_part)
        os.makedirs(partition_dir, exist_ok=True)
        
        file_path = os.path.join(partition_dir, "readings.jsonl")
        with open(file_path, "a") as f:
            f.write(json.dumps(reading) + "\n")
        return file_path

    def save_processed_hourly(self, date_str: str, records: List[Dict[str, Any]]) -> str:
        # /energy/processed/hourly/YYYY-MM-DD.json
        file_path = os.path.join(self.processed_dir, f"{date_str}.json")
        with open(file_path, "w") as f:
            json.dump(records, f, indent=2)
        return file_path

    def save_forecast(self, forecast_id: str, forecast_data: Dict[str, Any]) -> str:
        # /energy/forecasts/forecast_{id}.json
        file_path = os.path.join(self.forecasts_dir, f"forecast_{forecast_id}.json")
        with open(file_path, "w") as f:
            json.dump(forecast_data, f, indent=2)
        return file_path

    def save_model_metrics(self, model_name: str, metrics: Dict[str, Any]) -> str:
        # /energy/model-metrics/metrics_{model}.json
        file_path = os.path.join(self.metrics_dir, f"metrics_{model_name}.json")
        with open(file_path, "w") as f:
            json.dump(metrics, f, indent=2)
        return file_path

    def get_status(self) -> Dict[str, Any]:
        raw_count = sum(len(files) for _, _, files in os.walk(self.raw_dir))
        processed_count = sum(len(files) for _, _, files in os.walk(self.processed_dir))
        forecast_count = sum(len(files) for _, _, files in os.walk(self.forecasts_dir))

        return {
            "backend": "local",
            "status": "connected",
            "is_fallback": True,
            "base_path": self.base_dir,
            "directories": {
                "raw": self.raw_dir,
                "processed": self.processed_dir,
                "forecasts": self.forecasts_dir,
                "metrics": self.metrics_dir,
            },
            "file_counts": {
                "raw_files": raw_count,
                "processed_hourly_files": processed_count,
                "saved_forecasts": forecast_count,
            }
        }

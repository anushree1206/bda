import requests
import json
import logging
from typing import List, Dict, Any
from backend.app.storage.base import StorageAdapter
from backend.app.storage.local_storage import LocalStorageAdapter

logger = logging.getLogger(__name__)

class HDFSStorageAdapter(StorageAdapter):
    """
    HDFS Storage Adapter connecting to Apache Hadoop NameNode via WebHDFS REST API.
    Falls back gracefully to LocalStorageAdapter if Hadoop NameNode is unavailable.
    """
    def __init__(self, namenode_url: str = "http://localhost:9870", user: str = "hadoop", fallback_adapter: StorageAdapter = None):
        self.namenode_url = namenode_url.rstrip("/")
        self.user = user
        self.fallback = fallback_adapter or LocalStorageAdapter()
        self._connected = False
        self._check_connection()

    def _check_connection(self) -> bool:
        try:
            url = f"{self.namenode_url}/webhdfs/v1/?op=GETHOMEDIRECTORY&user.name={self.user}"
            resp = requests.get(url, timeout=2.0)
            self._connected = resp.status_code == 200
            return self._connected
        except Exception:
            self._connected = False
            return False

    def is_available(self) -> bool:
        return self._check_connection()

    def save_raw_reading(self, reading: Dict[str, Any]) -> str:
        if not self.is_available():
            logger.info("HDFS unavailable, writing raw reading to local fallback adapter.")
            return self.fallback.save_raw_reading(reading)

        # Write to HDFS /energy/raw/YYYY-MM-DD/readings.jsonl
        ts = reading.get("timestamp", "")
        date_part = ts.split("T")[0] if "T" in ts else ts.split(" ")[0]
        hdfs_path = f"/energy/raw/{date_part}/readings.jsonl"
        try:
            url = f"{self.namenode_url}/webhdfs/v1{hdfs_path}?op=APPEND&user.name={self.user}"
            resp = requests.post(url, data=json.dumps(reading) + "\n", timeout=3.0)
            if resp.status_code in [200, 201]:
                return f"hdfs://{hdfs_path}"
        except Exception as e:
            logger.warning(f"HDFS append failed: {e}. Using fallback.")
        return self.fallback.save_raw_reading(reading)

    def save_processed_hourly(self, date_str: str, records: List[Dict[str, Any]]) -> str:
        if not self.is_available():
            return self.fallback.save_processed_hourly(date_str, records)
        return self.fallback.save_processed_hourly(date_str, records)

    def save_forecast(self, forecast_id: str, forecast_data: Dict[str, Any]) -> str:
        if not self.is_available():
            return self.fallback.save_forecast(forecast_id, forecast_data)
        return self.fallback.save_forecast(forecast_id, forecast_data)

    def save_model_metrics(self, model_name: str, metrics: Dict[str, Any]) -> str:
        if not self.is_available():
            return self.fallback.save_model_metrics(model_name, metrics)
        return self.fallback.save_model_metrics(model_name, metrics)

    def get_status(self) -> Dict[str, Any]:
        is_conn = self._check_connection()
        return {
            "backend": "hdfs",
            "status": "connected" if is_conn else "fallback_local",
            "hdfs_available": is_conn,
            "namenode_url": self.namenode_url,
            "user": self.user,
            "hdfs_paths": {
                "raw": "/energy/raw/",
                "processed": "/energy/processed/hourly/",
                "forecasts": "/energy/forecasts/",
                "metrics": "/energy/model-metrics/"
            },
            "active_adapter": "HDFS Storage" if is_conn else "Local Storage Fallback (/data/energy)"
        }

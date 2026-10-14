from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class StorageAdapter(ABC):
    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def save_raw_reading(self, reading: Dict[str, Any]) -> str:
        """Stores a raw smart meter record into date-partitioned storage /energy/raw/"""
        pass

    @abstractmethod
    def save_processed_hourly(self, date_str: str, records: List[Dict[str, Any]]) -> str:
        """Stores hourly aggregated records into /energy/processed/hourly/"""
        pass

    @abstractmethod
    def save_forecast(self, forecast_id: str, forecast_data: Dict[str, Any]) -> str:
        """Stores forecast output in /energy/forecasts/"""
        pass

    @abstractmethod
    def save_model_metrics(self, model_name: str, metrics: Dict[str, Any]) -> str:
        """Stores model metrics into /energy/model-metrics/"""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns storage health, backend name, path, and stats"""
        pass

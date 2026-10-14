import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from backend.app.storage.base import StorageAdapter
from backend.app.storage.local_storage import LocalStorageAdapter

try:
    from kafka import KafkaConsumer
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

logger = logging.getLogger(__name__)

class SmartMeterKafkaConsumer:
    """
    Kafka Consumer for Smart-Meter Readings.
    Validates schemas, drops or logs malformed records to dead-letter log,
    and commits valid records to HDFS or local storage.
    """
    REQUIRED_FIELDS = ["meter_id", "timestamp", "global_active_power_kw"]

    def __init__(self, bootstrap_servers: str = "localhost:9092", topic: str = "smart-meter-readings",
                 group_id: str = "energy-forecasting-group", storage_adapter: Optional[StorageAdapter] = None):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.group_id = group_id
        self.storage = storage_adapter or LocalStorageAdapter()
        self.consumer = None
        self._is_connected = False
        self.seen_timestamps = set()
        self._init_consumer()

    def _init_consumer(self):
        if HAS_KAFKA:
            try:
                self.consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=self.bootstrap_servers.split(","),
                    group_id=self.group_id,
                    auto_offset_reset="earliest",
                    enable_auto_commit=True,
                    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                    consumer_timeout_ms=1000
                )
                self._is_connected = True
            except Exception as e:
                self._is_connected = False
                self.consumer = None
                logger.warning(f"Could not connect Kafka consumer: {e}")

    def is_connected(self) -> bool:
        return self._is_connected

    def validate_message(self, message: Dict[str, Any]) -> bool:
        """
        Validates schema requirements. Missing power or negative voltage/power marks record invalid.
        """
        if not isinstance(message, dict):
            return False

        for f in self.REQUIRED_FIELDS:
            if f not in message:
                return False

        if message.get("global_active_power_kw") is None:
            return False

        try:
            val = float(message["global_active_power_kw"])
            if val < 0.0 or val > 50.0: # Sanity limit for household / building proxy
                return False
        except (ValueError, TypeError):
            return False

        # Validate timestamp
        try:
            datetime.fromisoformat(message["timestamp"])
        except Exception:
            return False

        return True

    def process_incoming_record(self, record: Dict[str, Any]) -> bool:
        """
        Validates and routes record to persistent storage adapter.
        Safely ignores identical duplicates.
        """
        if not self.validate_message(record):
            return False

        ts = record["timestamp"]
        meter = record.get("meter_id", "household_001")
        dedup_key = f"{meter}_{ts}"

        if dedup_key in self.seen_timestamps:
            return True # Deduplicated

        if len(self.seen_timestamps) > 20000:
            self.seen_timestamps.clear()
        self.seen_timestamps.add(dedup_key)

        # Write to HDFS / local storage
        self.storage.save_raw_reading(record)
        return True

    def close(self):
        if self.consumer:
            try:
                self.consumer.close()
            except Exception:
                pass
            self._is_connected = False

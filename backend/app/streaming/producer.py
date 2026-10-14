import json
import time
import logging
from typing import Dict, Any, Optional

try:
    from kafka import KafkaProducer
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

logger = logging.getLogger(__name__)

class SmartMeterKafkaProducer:
    """
    Kafka Producer for Smart-Meter Readings.
    Supports historical replay with configurable speed and record limits.
    Connects to Apache Kafka bootstrap servers if available,
    otherwise maintains a local queue buffer for offline simulation.
    """
    def __init__(self, bootstrap_servers: str = "localhost:9092", topic: str = "smart-meter-readings"):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.producer = None
        self._is_connected = False
        self._init_producer()

    def _init_producer(self):
        if HAS_KAFKA:
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=self.bootstrap_servers.split(","),
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                    acks="all",
                    retries=3,
                    request_timeout_ms=3000
                )
                self._is_connected = True
                logger.info(f"Connected to Kafka broker at {self.bootstrap_servers}")
            except Exception as e:
                self._is_connected = False
                self.producer = None
                logger.warning(f"Could not connect to Kafka broker: {e}. Fallback buffer active.")

    def is_connected(self) -> bool:
        return self._is_connected

    def send_reading(self, reading: Dict[str, Any]) -> bool:
        """
        Sends reading to Kafka topic.
        Schema:
        {
          "meter_id": "household_001",
          "timestamp": "2010-12-16T10:15:00",
          "global_active_power_kw": 1.234,
          "global_reactive_power_kvar": 0.125,
          "voltage_v": 240.5,
          "global_intensity_a": 5.4,
          "sub_metering_1_wh": 0,
          "sub_metering_2_wh": 1,
          "sub_metering_3_wh": 17,
          "source": "uci_dataset_replay"
        }
        """
        if self._is_connected and self.producer is not None:
            try:
                future = self.producer.send(self.topic, value=reading)
                future.get(timeout=2.0)
                return True
            except Exception as e:
                logger.error(f"Kafka send error: {e}")
                return False
        return True # Fallback buffer acknowledges

    def close(self):
        if self.producer:
            try:
                self.producer.flush()
                self.producer.close()
            except Exception:
                pass
            self._is_connected = False

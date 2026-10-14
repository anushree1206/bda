import threading
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from backend.app.streaming.producer import SmartMeterKafkaProducer
from backend.app.streaming.consumer import SmartMeterKafkaConsumer
from backend.app.services.dataset_service import dataset_service
from backend.app.storage.local_storage import LocalStorageAdapter
from backend.app.config import settings

logger = logging.getLogger(__name__)

class PipelineService:
    def __init__(self):
        self.producer = SmartMeterKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            topic=settings.kafka_topic
        )
        self.storage = LocalStorageAdapter()
        self.consumer = SmartMeterKafkaConsumer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            topic=settings.kafka_topic,
            storage_adapter=self.storage
        )
        
        self.state = "idle" # idle, running, stopped, error
        self.messages_produced = 0
        self.messages_consumed = 0
        self.valid_records = 0
        self.rejected_records = 0
        self.last_processed_timestamp: Optional[str] = None
        self.replay_speed = 10.0
        self.recent_error: Optional[str] = None
        self._worker_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def start_replay(self, replay_speed: float = 10.0, batch_size: int = 50, max_records: Optional[int] = 5000, meter_id: str = "household_001") -> Dict[str, Any]:
        if self.state == "running":
            return {"status": "already_running", "message": "Pipeline worker is already actively streaming."}

        self._stop_event.clear()
        self.replay_speed = max(0.1, replay_speed)
        self.state = "running"
        self.recent_error = None

        def run_worker():
            try:
                readings, stats = dataset_service.load_dataset(limit=max_records)
                if not readings:
                    self.state = "error"
                    self.recent_error = "Dataset is empty or file not found."
                    return

                delay = max(0.001, 1.0 / self.replay_speed)

                for idx, record in enumerate(readings):
                    if self._stop_event.is_set():
                        break

                    # Format message according to Kafka schema
                    message = {
                        "meter_id": meter_id,
                        "timestamp": record["timestamp"],
                        "global_active_power_kw": record["global_active_power_kw"],
                        "global_reactive_power_kvar": record.get("global_reactive_power_kvar"),
                        "voltage_v": record.get("voltage_v"),
                        "global_intensity_a": record.get("global_intensity_a"),
                        "sub_metering_1_wh": record.get("sub_metering_1_wh"),
                        "sub_metering_2_wh": record.get("sub_metering_2_wh"),
                        "sub_metering_3_wh": record.get("sub_metering_3_wh"),
                        "source": "uci_dataset_replay"
                    }

                    # Step 1: Kafka Producer
                    self.producer.send_reading(message)
                    self.messages_produced += 1

                    # Step 2: Kafka Consumer validation & persistence
                    is_valid = self.consumer.process_incoming_record(message)
                    self.messages_consumed += 1

                    if is_valid:
                        self.valid_records += 1
                        self.last_processed_timestamp = message["timestamp"]
                    else:
                        self.rejected_records += 1

                    # Batch delay
                    if idx % batch_size == 0:
                        time.sleep(delay)

                self.state = "stopped" if self._stop_event.is_set() else "completed"
            except Exception as e:
                self.state = "error"
                self.recent_error = str(e)
                logger.error(f"Pipeline error: {e}", exc_info=True)

        self._worker_thread = threading.Thread(target=run_worker, daemon=True)
        self._worker_thread.start()

        return {
            "status": "started",
            "replay_speed": self.replay_speed,
            "batch_size": batch_size,
            "max_records": max_records
        }

    def stop_replay(self) -> Dict[str, Any]:
        if self.state == "running":
            self._stop_event.set()
            self.state = "stopped"
            return {"status": "stopping", "message": "Pipeline graceful shutdown signal dispatched."}
        return {"status": self.state, "message": "Pipeline is not currently streaming."}

    def get_status(self) -> Dict[str, Any]:
        storage_status = self.storage.get_status()
        return {
            "state": self.state,
            "messages_produced": self.messages_produced,
            "messages_consumed": self.messages_consumed,
            "valid_records": self.valid_records,
            "rejected_records": self.rejected_records,
            "last_processed_timestamp": self.last_processed_timestamp,
            "active_storage_backend": "HDFS Storage" if settings.storage_backend == "hdfs" and self.consumer.storage.is_available() else "Local File Storage Adapter (/data/energy)",
            "recent_error_summary": self.recent_error,
            "replay_speed": self.replay_speed,
            "storage_directories": storage_status.get("directories", {})
        }

pipeline_service = PipelineService()

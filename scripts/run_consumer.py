#!/usr/bin/env python3
"""
CLI to run Kafka consumer worker listening to smart-meter-readings.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.streaming.consumer import SmartMeterKafkaConsumer
from backend.app.config import settings

def main():
    print(f"Connecting consumer to Kafka topic '{settings.kafka_topic}' on {settings.kafka_bootstrap_servers}...")
    consumer = SmartMeterKafkaConsumer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        topic=settings.kafka_topic,
        group_id=settings.kafka_consumer_group
    )

    if not consumer.is_connected():
        print("[!] Native Kafka broker not reached. Offline local buffer will handle storage adapter routing.")
        return

    print("Consumer listening for smart meter events... Press Ctrl+C to terminate.")
    try:
        for message in consumer.consumer:
            record = message.value
            valid = consumer.process_incoming_record(record)
            ts = record.get("timestamp")
            kw = record.get("global_active_power_kw")
            print(f"[Record] TS: {ts} | Power: {kw} kW | Valid: {valid}")
    except KeyboardInterrupt:
        print("\nClosing consumer cleanly...")
        consumer.close()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
CLI to run Kafka producer historical replay.
"""
import sys
import os
import argparse
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.pipeline_service import pipeline_service

def main():
    parser = argparse.ArgumentParser(description="Smart Meter Kafka Historical Replay Producer")
    parser.add_argument("--speed", type=float, default=20.0, help="Replay speed multiplier")
    parser.add_argument("--batch", type=int, default=50, help="Batch size")
    parser.add_argument("--max-records", type=int, default=2000, help="Max records to replay")
    parser.add_argument("--meter-id", type=str, default="household_001", help="Smart meter identifier")
    args = parser.parse_args()

    print(f"Starting historical replay: speed={args.speed}x, batch={args.batch}, max_records={args.max_records}...")
    res = pipeline_service.start_replay(
        replay_speed=args.speed,
        batch_size=args.batch,
        max_records=args.max_records,
        meter_id=args.meter_id
    )
    print(res)

    try:
        while pipeline_service.state == "running":
            st = pipeline_service.get_status()
            print(f"\rProduced: {st['messages_produced']} | Consumed: {st['messages_consumed']} | Valid: {st['valid_records']} | Last: {st['last_processed_timestamp']}", end="", flush=True)
            time.sleep(1)
        print("\nReplay finished with state:", pipeline_service.state)
    except KeyboardInterrupt:
        print("\nStopping replay gracefully...")
        pipeline_service.stop_replay()

if __name__ == "__main__":
    main()

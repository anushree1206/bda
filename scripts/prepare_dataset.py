#!/usr/bin/env python3
"""
Prepares, cleans, and hourly-aggregates the UCI dataset, saving outputs to local/HDFS storage.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.dataset_service import dataset_service
from backend.app.services.preprocessing_service import preprocessing_service

def main():
    print("Loading and parsing dataset...")
    readings, stats = dataset_service.load_dataset()
    print(f"Total lines parsed: {stats.get('total_parsed', 0)}")
    print(f"Valid records: {stats.get('valid_records', 0)}")
    print(f"Missing records: {stats.get('missing_power_records', 0)} ({stats.get('missing_percentage', 0)}%)")

    print("Resampling minute-level readings into hourly average active power (kW)...")
    hourly = preprocessing_service.resample_to_hourly(raw_readings=readings, force_refresh=True)
    print(f"Generated {len(hourly)} hourly buckets.")
    complete_count = sum(1 for h in hourly if h["is_complete"])
    print(f"Complete hours (>75% valid minute coverage): {complete_count}/{len(hourly)} ({round(complete_count/len(hourly)*100, 1)}%)")
    print(f"First hour: {hourly[0]['timestamp']} | Avg Power: {hourly[0]['global_active_power_kw']} kW")
    print(f"Last hour:  {hourly[-1]['timestamp']} | Avg Power: {hourly[-1]['global_active_power_kw']} kW")

if __name__ == "__main__":
    main()

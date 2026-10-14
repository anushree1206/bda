#!/usr/bin/env python3
"""
CLI to run holdout evaluation and output detailed residual error analysis.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.forecasting_service import forecasting_service
from backend.app.database.db import db_manager

def main():
    metrics = db_manager.get_latest_metrics()
    if not metrics:
        print("No metrics stored yet. Running train and evaluate...")
        res = forecasting_service.train_and_evaluate_all()
        metrics = res["models_comparison"]

    print("Detailed Evaluation Metrics on Holdout Test Set:")
    for model_name, m in metrics.items():
        print(f"\nModel: {model_name}")
        print(f"  MAE:  {m.get('mae')} kW")
        print(f"  RMSE: {m.get('rmse')} kW")
        print(f"  MAPE: {m.get('mape')}% (Target < 10%: {'ACHIEVED' if m.get('target_achieved') else 'NOT ACHIEVED'})")
        print(f"  WAPE: {m.get('wape')}%")
        print(f"  Sample Count: {m.get('sample_count')}")
        if m.get("mape_warning"):
            print(f"  Note: {m['mape_warning']}")

if __name__ == "__main__":
    main()

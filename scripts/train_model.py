#!/usr/bin/env python3
"""
CLI to train, evaluate, and save models (Seasonal Naive, ARIMA, Prophet).
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.forecasting_service import forecasting_service

def main():
    print("Training and evaluating forecasting models on chronological holdout split...")
    results = forecasting_service.train_and_evaluate_all()
    print("\n================== MODEL EVALUATION SUMMARY ==================")
    print(f"Selected Best Model: {results['selected_model'].upper()}")
    print(f"Target MAPE Threshold: < {results['target_mape_threshold']}%")
    print("-" * 62)
    print(f"{'Model':<20} | {'MAE (kW)':<10} | {'RMSE (kW)':<10} | {'MAPE (%)':<10} | {'WAPE (%)':<10}")
    print("-" * 62)
    for model_name, m in results["models_comparison"].items():
        print(f"{model_name:<20} | {m['mae']:<10.4f} | {m['rmse']:<10.4f} | {m['mape']:<10.2f} | {m['wape']:<10.2f}")
    print("-" * 62)
    print("\nAdvisory Recommendations:")
    for rec in results["recommendations"]:
        print(f"• {rec}")

if __name__ == "__main__":
    main()

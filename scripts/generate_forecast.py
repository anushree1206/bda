#!/usr/bin/env python3
"""
CLI to generate 24-hour demand forecast and detect peak demand.
"""
import sys
import os
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.forecasting_service import forecasting_service

def main():
    parser = argparse.ArgumentParser(description="Generate 24-hour power demand forecast")
    parser.add_argument("--model", type=str, default="prophet", choices=["baseline", "arima", "prophet"])
    parser.add_argument("--horizon", type=int, default=24)
    args = parser.parse_args()

    print(f"Generating {args.horizon}-hour forecast using {args.model.upper()}...")
    res = forecasting_service.generate_forecast(model_name=args.model, horizon_hours=args.horizon)

    peak = res["peak_demand"]
    print(f"\n[★] PREDICTED PEAK DEMAND: {peak['peak_power_kw']:.3f} kW at {peak['peak_timestamp']} (Hour {peak['peak_hour']:02d}:00)")
    print("-" * 55)
    print(f"{'Hour':<6} | {'Timestamp':<20} | {'Forecast (kW)':<12} | {'90% Conf Interval'}")
    print("-" * 55)
    for idx, p in enumerate(res["forecast_series"]):
        print(f"{idx+1:<6} | {p['timestamp']:<20} | {p['predicted_power_kw']:<12.3f} | [{p['lower_bound_kw']:.2f} - {p['upper_bound_kw']:.2f}] kW")

if __name__ == "__main__":
    main()

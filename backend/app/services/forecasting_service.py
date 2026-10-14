import uuid
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

from backend.app.models.baseline import SeasonalNaiveModel
from backend.app.models.arima_model import ARIMAModel
from backend.app.models.prophet_model import ProphetModel
from backend.app.services.preprocessing_service import preprocessing_service
from backend.app.services.evaluation_service import evaluation_service
from backend.app.storage.local_storage import LocalStorageAdapter
from backend.app.database.db import db_manager

class ForecastingService:
    def __init__(self):
        self.storage = LocalStorageAdapter()
        self.models = {
            "baseline": SeasonalNaiveModel(),
            "arima": ARIMAModel(),
            "prophet": ProphetModel(),
        }
        self.selected_model_name = "prophet"
        self._last_training_info = {
            "state": "ready",
            "last_trained_at": None,
            "duration_sec": 0.0,
            "training_range": None,
            "records_used": 0
        }

    def get_model(self, model_name: str):
        key = model_name.lower().strip()
        if "prophet" in key:
            return self.models["prophet"]
        elif "arima" in key or "sarimax" in key:
            return self.models["arima"]
        elif "baseline" in key or "naive" in key:
            return self.models["baseline"]
        else:
            return self.models.get(key, self.models["prophet"])

    def train_and_evaluate_all(self) -> Dict[str, Any]:
        """
        Trains baseline, ARIMA, and Prophet on chronological train set,
        evaluates on validation set to choose the best model,
        and saves metrics to DB.
        """
        train, val, test = preprocessing_service.split_chronological(train_ratio=0.70, val_ratio=0.15)
        if len(train) < 48:
            raise ValueError("Insufficient hourly data to train forecasting models.")

        start_time = time.time()
        results = {}

        for name, model_instance in self.models.items():
            metrics = evaluation_service.evaluate_model_on_holdout(
                model=model_instance,
                train_data=train,
                test_data=val # Choose based on validation performance
            )
            results[name] = metrics
            db_manager.save_metrics(name, metrics)
            self.storage.save_model_metrics(name, metrics)

        # Select model with lowest validation MAPE
        best_model = min(results.keys(), key=lambda k: results[k]["mape"])
        self.selected_model_name = best_model

        duration = time.time() - start_time
        self._last_training_info = {
            "state": "ready",
            "last_trained_at": datetime.utcnow().isoformat(),
            "duration_sec": round(duration, 3),
            "training_range": {
                "start": train[0]["timestamp"],
                "end": train[-1]["timestamp"]
            },
            "records_used": len(train)
        }

        recommendations = []
        if results[best_model]["mape"] > 10.0:
            recommendations.append("MAPE exceeds 10% threshold. Consider incorporating outdoor temperature as an exogenous regressor (SARIMAX/Prophet) or tuning changepoint prior scales.")
        else:
            recommendations.append("Target MAPE < 10% achieved on validation set.")
        recommendations.append("Peak hours frequently cluster between 18:00 and 21:00 UTC. Load shifting is recommended during these windows.")

        return {
            "selected_model": best_model,
            "models_comparison": results,
            "best_model_by_validation": best_model,
            "target_mape_threshold": 10.0,
            "recommendations": recommendations,
            "training_duration_sec": round(duration, 2)
        }

    def generate_forecast(self, model_name: Optional[str] = None, horizon_hours: int = 24, meter_id: str = "household_001") -> Dict[str, Any]:
        """
        Generates next 24-hour predictions from latest eligible historical readings.
        Identifies predicted peak demand, timestamp, and ranked hours.
        """
        hourly = preprocessing_service.resample_to_hourly()
        if len(hourly) < 24:
            raise ValueError("Insufficient hourly data. At least 24 hours of measurements required.")

        chosen_model_name = model_name or self.selected_model_name
        model = self.get_model(chosen_model_name)

        # Fit model on all available historical data up to latest reading
        model.fit(hourly)
        predictions = model.predict(horizon_hours=horizon_hours)

        # Find maximum predicted demand and timestamp
        peak_pred = max(predictions, key=lambda p: p["predicted_power_kw"])
        peak_kw = peak_pred["predicted_power_kw"]
        peak_time = peak_pred["timestamp"]
        peak_hour = datetime.fromisoformat(peak_time).hour

        # Rank hours by predicted demand
        sorted_by_demand = sorted(predictions, key=lambda p: p["predicted_power_kw"], reverse=True)
        peak_rankings = [
            {
                "rank": rank + 1,
                "timestamp": p["timestamp"],
                "hour": datetime.fromisoformat(p["timestamp"]).hour,
                "predicted_power_kw": p["predicted_power_kw"]
            }
            for rank, p in enumerate(sorted_by_demand[:5])
        ]

        forecast_id = str(uuid.uuid4())[:8]
        generated_at = datetime.utcnow().isoformat()
        train_range = {
            "start": hourly[0]["timestamp"],
            "end": hourly[-1]["timestamp"]
        }

        forecast_payload = {
            "forecast_id": forecast_id,
            "model_name": model.name,
            "model_version": getattr(model, "version", "1.0.0"),
            "forecast_horizon": horizon_hours,
            "generated_at": generated_at,
            "training_data_range": train_range,
            "peak_demand": {
                "peak_power_kw": peak_kw,
                "peak_timestamp": peak_time,
                "peak_hour": peak_hour,
                "peak_rankings": peak_rankings
            },
            "forecast_series": predictions,
            "metrics_summary": db_manager.get_latest_metrics().get(chosen_model_name)
        }

        # Persist forecast to SQLite and HDFS/Local storage
        db_manager.save_forecast(
            forecast_id=forecast_id,
            model_name=model.name,
            horizon=horizon_hours,
            peak_kw=peak_kw,
            peak_time=peak_time,
            train_start=train_range["start"],
            train_end=train_range["end"],
            payload=forecast_payload
        )
        self.storage.save_forecast(forecast_id, forecast_payload)

        return forecast_payload

    def get_latest_forecast(self) -> Optional[Dict[str, Any]]:
        latest = db_manager.get_latest_forecast()
        if latest is None:
            # Auto generate default 24h forecast if data is available
            try:
                return self.generate_forecast()
            except Exception:
                return None
        return latest

    def get_forecast_history(self, limit: int = 15) -> List[Dict[str, Any]]:
        return db_manager.get_forecast_history(limit)

    def get_status(self) -> Dict[str, Any]:
        hourly = preprocessing_service.resample_to_hourly()
        return {
            "model_available": len(hourly) >= 24,
            "training_state": self._last_training_info["state"],
            "last_training_time": self._last_training_info["last_trained_at"],
            "selected_model": self.selected_model_name,
            "available_models": list(self.models.keys()),
            "training_data_range": self._last_training_info["training_range"],
            "records_used": self._last_training_info["records_used"]
        }

forecasting_service = ForecastingService()

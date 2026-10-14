import pytest
from datetime import datetime
from backend.app.models.baseline import SeasonalNaiveModel
from backend.app.models.arima_model import ARIMAModel
from backend.app.models.prophet_model import ProphetModel
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.forecasting_service import ForecastingService

def generate_mock_hourly(hours_count=72):
    readings = []
    base_dt = datetime(2010, 11, 15, 0, 0, 0)
    import math
    for h in range(hours_count):
        dt = base_dt + datetime.timedelta(hours=h)
        # Diurnal pattern
        val = 1.0 + 0.8 * math.sin(dt.hour / 24.0 * 2 * math.pi)
        readings.append({
            "timestamp": dt.isoformat(),
            "meter_id": "household_001",
            "global_active_power_kw": max(0.2, val),
            "voltage_v": 240.0
        })
    return readings

def test_models_forecast_horizon_and_peak():
    mock_history = generate_mock_hourly(72)
    models = [SeasonalNaiveModel(), ARIMAModel(), ProphetModel()]

    for m in models:
        m.fit(mock_history)
        preds = m.predict(horizon_hours=24)
        
        # Check horizon length
        assert len(preds) == 24
        
        # Check timestamps are strictly ascending
        for i in range(len(preds) - 1):
            assert preds[i]["timestamp"] < preds[i+1]["timestamp"]
            
        # Check values are finite and positive
        for p in preds:
            assert p["predicted_power_kw"] > 0
            assert p["lower_bound_kw"] is not None
            assert p["upper_bound_kw"] is not None
            assert p["lower_bound_kw"] <= p["upper_bound_kw"]

def test_evaluation_metrics_and_zero_handling():
    eval_svc = EvaluationService()
    actuals = [1.0, 2.0, 0.02, 1.5, 3.0] # includes near-zero observation 0.02
    predictions = [1.1, 1.9, 0.05, 1.4, 3.2]

    metrics = eval_svc.calculate_metrics(actuals, predictions)
    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["wape"] > 0
    assert metrics["mape"] > 0
    assert metrics["sample_count"] == 5
    # Warning generated for excluded near-zero observation
    assert metrics["mape_warning"] is not None

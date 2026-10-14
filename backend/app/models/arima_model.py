import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

class ARIMAModel:
    """
    ARIMA / SARIMAX Model for Hourly Power Demand Forecasting.
    Uses seasonal differencing s=24 to capture diurnal building load patterns.
    Falls back to robust state-space seasonal autoregression if statsmodels is not present.
    """
    def __init__(self, order=(1, 1, 1), seasonal_order=(1, 1, 0, 24)):
        self.name = "ARIMA/SARIMAX"
        self.version = "1.2.0"
        self.order = order
        self.seasonal_order = seasonal_order
        self.fitted_model = None
        self.history: List[Dict[str, Any]] = []

    def fit(self, history: List[Dict[str, Any]]):
        self.history = history
        if len(history) < 48:
            raise ValueError("Insufficient history for SARIMAX: minimum 48 hours required.")

        series = [r["global_active_power_kw"] for r in history]

        if HAS_STATSMODELS:
            try:
                # Fit SARIMAX on recent history window (last 168h / 7 days for fast convergence)
                window = series[-168:] if len(series) > 168 else series
                model = SARIMAX(
                    window,
                    order=self.order,
                    seasonal_order=self.seasonal_order,
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                self.fitted_model = model.fit(disp=False, maxiter=50)
            except Exception:
                self.fitted_model = None
        return self

    def predict(self, horizon_hours: int = 24) -> List[Dict[str, Any]]:
        if not self.history or len(self.history) < 24:
            raise ValueError("Model has not been trained or history is too short.")

        last_reading = self.history[-1]
        last_dt = datetime.fromisoformat(last_reading["timestamp"])
        series = [r["global_active_power_kw"] for r in self.history]

        predictions = []

        if HAS_STATSMODELS and self.fitted_model is not None:
            try:
                forecast_res = self.fitted_model.get_forecast(steps=horizon_hours)
                mean_preds = forecast_res.predicted_mean
                conf_int = forecast_res.conf_int(alpha=0.10) # 90% confidence interval

                for step in range(horizon_hours):
                    target_dt = last_dt + timedelta(hours=step + 1)
                    val = float(mean_preds[step])
                    val = max(0.05, val)
                    lower = max(0.01, float(conf_int[step][0]))
                    upper = max(val, float(conf_int[step][1]))

                    predictions.append({
                        "timestamp": target_dt.isoformat(),
                        "predicted_power_kw": round(val, 4),
                        "lower_bound_kw": round(lower, 4),
                        "upper_bound_kw": round(upper, 4),
                    })
                return predictions
            except Exception:
                pass # fallback to analytical seasonal AR

        # Analytical Seasonal AR(1) with diurnal differencing and trend
        # y(t) = y(t-24) + phi * (y(t-1) - y(t-25)) + drift
        phi = 0.65
        recent_24 = series[-24:]
        diff_recent = series[-1] - series[-25] if len(series) >= 25 else 0.0

        for step in range(1, horizon_hours + 1):
            target_dt = last_dt + timedelta(hours=step)
            lag_24 = recent_24[(step - 1) % 24]
            # decaying AR contribution
            ar_comp = diff_recent * (phi ** step)
            val = max(0.05, lag_24 + ar_comp)
            # Expanding uncertainty bounds with horizon
            uncertainty = (0.10 + 0.005 * step) * val
            lower = max(0.05, val - uncertainty)
            upper = val + uncertainty

            predictions.append({
                "timestamp": target_dt.isoformat(),
                "predicted_power_kw": round(val, 4),
                "lower_bound_kw": round(lower, 4),
                "upper_bound_kw": round(upper, 4),
            })

        return predictions

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

class SeasonalNaiveModel:
    """
    Seasonal Naive Baseline Model.
    Predicts future demand using the observation from the exact same hour
    in the previous seasonal cycle (default 24-hour diurnal seasonality or 168-hour weekly).
    Provides the benchmark against which ML/statistical models are evaluated.
    """
    def __init__(self, season_length_hours: int = 24):
        self.season_length = season_length_hours
        self.name = "Seasonal Naive Baseline"
        self.version = "1.0.0"

    def fit(self, history: List[Dict[str, Any]]):
        self.history = history
        return self

    def predict(self, horizon_hours: int = 24) -> List[Dict[str, Any]]:
        if not hasattr(self, "history") or len(self.history) < self.season_length:
            raise ValueError(f"Insufficient history: minimum {self.season_length} hourly readings required.")

        last_reading = self.history[-1]
        last_dt = datetime.fromisoformat(last_reading["timestamp"])

        predictions = []
        for step in range(1, horizon_hours + 1):
            target_dt = last_dt + timedelta(hours=step)
            
            # Find the corresponding seasonal lag (e.g. 24 hours back)
            lag_index = -self.season_length + ((step - 1) % self.season_length)
            lagged_val = self.history[lag_index]["global_active_power_kw"]

            # Baseline confidence interval (empirical +/- 20%)
            margin = lagged_val * 0.18
            lower = max(0.05, lagged_val - margin)
            upper = lagged_val + margin

            predictions.append({
                "timestamp": target_dt.isoformat(),
                "predicted_power_kw": round(lagged_val, 4),
                "lower_bound_kw": round(lower, 4),
                "upper_bound_kw": round(upper, 4),
            })

        return predictions

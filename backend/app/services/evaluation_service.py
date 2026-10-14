import math
from typing import List, Dict, Any, Tuple, Optional

class EvaluationService:
    """
    Computes rigorous time-series forecasting metrics:
    - MAE: Mean Absolute Error
    - RMSE: Root Mean Squared Error
    - MAPE: Mean Absolute Percentage Error (with documented threshold for near-zero values)
    - WAPE: Weighted Absolute Percentage Error
    """
    # Policy: Actual power readings < 0.05 kW are considered near-zero/noise
    # Dividing by near-zero inflates MAPE to infinity without reflecting practical forecasting error.
    ZERO_THRESHOLD_KW = 0.05

    def calculate_metrics(self, actuals: List[float], predictions: List[float],
                          evaluation_start: str = "", evaluation_end: str = "") -> Dict[str, Any]:
        if len(actuals) != len(predictions) or len(actuals) == 0:
            return {
                "mae": 0.0, "rmse": 0.0, "mape": 0.0, "wape": 0.0,
                "sample_count": 0, "target_achieved": False,
                "evaluation_period": {"start": evaluation_start, "end": evaluation_end},
                "mape_warning": "No matching actuals and predictions to evaluate."
            }

        n = len(actuals)
        abs_errors = [abs(a - p) for a, p in zip(actuals, predictions)]
        squared_errors = [(a - p) ** 2 for a, p in zip(actuals, predictions)]

        mae = sum(abs_errors) / n
        rmse = math.sqrt(sum(squared_errors) / n)

        # WAPE: Weighted Absolute Percentage Error (sum of errors / sum of actuals)
        total_actual = sum(actuals)
        wape = (sum(abs_errors) / total_actual * 100.0) if total_actual > 0 else 0.0

        # MAPE calculation on eligible non-zero observations
        eligible_pairs = [(a, p) for a, p in zip(actuals, predictions) if a >= self.ZERO_THRESHOLD_KW]
        excluded_count = n - len(eligible_pairs)

        mape_warning = None
        if len(eligible_pairs) > 0:
            percentage_errors = [abs(a - p) / a for a, p in eligible_pairs]
            mape = (sum(percentage_errors) / len(eligible_pairs)) * 100.0
            if excluded_count > 0:
                mape_warning = (f"{excluded_count} observations below {self.ZERO_THRESHOLD_KW} kW threshold "
                                f"were excluded from MAPE to avoid divide-by-zero distortion. WAPE is provided as unbiased aggregate.")
        else:
            mape = wape
            mape_warning = f"All observations were below {self.ZERO_THRESHOLD_KW} kW; MAPE defaulted to WAPE."

        target_achieved = mape < 10.0

        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "mape": round(mape, 2),
            "wape": round(wape, 2),
            "sample_count": n,
            "eligible_mape_samples": len(eligible_pairs),
            "excluded_near_zero_samples": excluded_count,
            "target_achieved": target_achieved,
            "target_threshold_mape": 10.0,
            "evaluation_period": {
                "start": evaluation_start,
                "end": evaluation_end
            },
            "mape_warning": mape_warning
        }

    def evaluate_model_on_holdout(self, model, train_data: List[Dict[str, Any]], test_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Fits the model strictly on train_data (NO data leakage)
        and evaluates 24-step forecasts against test_data.
        """
        if len(train_data) < 24 or len(test_data) < 24:
            raise ValueError("Insufficient data for holdout evaluation.")

        # Train model
        model.fit(train_data)

        # Predict horizon equal to min(len(test_data), 24)
        horizon = min(len(test_data), 24)
        preds = model.predict(horizon_hours=horizon)

        actual_vals = [r["global_active_power_kw"] for r in test_data[:horizon]]
        pred_vals = [p["predicted_power_kw"] for p in preds]

        metrics = self.calculate_metrics(
            actuals=actual_vals,
            predictions=pred_vals,
            evaluation_start=test_data[0]["timestamp"],
            evaluation_end=test_data[horizon - 1]["timestamp"]
        )

        # Build comparison points
        comparison_series = []
        for i in range(horizon):
            diff = pred_vals[i] - actual_vals[i]
            comparison_series.append({
                "timestamp": test_data[i]["timestamp"],
                "actual_kw": round(actual_vals[i], 3),
                "predicted_kw": round(pred_vals[i], 3),
                "residual_kw": round(diff, 3),
                "abs_error_kw": round(abs(diff), 3)
            })

        metrics["comparison_series"] = comparison_series
        return metrics

evaluation_service = EvaluationService()

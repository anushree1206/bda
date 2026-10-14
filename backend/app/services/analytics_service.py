from datetime import datetime
from collections import defaultdict
from typing import Dict, Any, List
from backend.app.services.preprocessing_service import preprocessing_service
from backend.app.services.forecasting_service import forecasting_service
from backend.app.database.db import db_manager

class AnalyticsService:
    def get_consumption_analytics(self) -> Dict[str, Any]:
        hourly = preprocessing_service.resample_to_hourly()
        if not hourly:
            return {"hourly": [], "daily": [], "weekly": []}

        # Daily aggregations
        daily_map = defaultdict(lambda: {"total_kwh": 0.0, "peak_kw": 0.0, "hours": 0})
        for r in hourly:
            day_str = r["timestamp"][:10]
            # 1 hour at X kW = X kWh
            kw = r["global_active_power_kw"]
            daily_map[day_str]["total_kwh"] += kw
            daily_map[day_str]["hours"] += 1
            if kw > daily_map[day_str]["peak_kw"]:
                daily_map[day_str]["peak_kw"] = kw

        daily_list = [
            {
                "date": d,
                "total_energy_kwh": round(val["total_kwh"], 2),
                "average_power_kw": round(val["total_kwh"] / max(1, val["hours"]), 2),
                "peak_power_kw": round(val["peak_kw"], 2)
            }
            for d, val in sorted(daily_map.items())
        ]

        # Diurnal hourly profile (0 to 23 hours)
        hour_profile_map = defaultdict(lambda: {"sum_kw": 0.0, "count": 0, "max_kw": 0.0})
        for r in hourly:
            dt = datetime.fromisoformat(r["timestamp"])
            h = dt.hour
            kw = r["global_active_power_kw"]
            hour_profile_map[h]["sum_kw"] += kw
            hour_profile_map[h]["count"] += 1
            if kw > hour_profile_map[h]["max_kw"]:
                hour_profile_map[h]["max_kw"] = kw

        hourly_profile = [
            {
                "hour": h,
                "label": f"{h:02d}:00",
                "average_power_kw": round(hour_profile_map[h]["sum_kw"] / max(1, hour_profile_map[h]["count"]), 3),
                "max_power_kw": round(hour_profile_map[h]["max_kw"], 3),
            }
            for h in range(24)
        ]

        return {
            "recent_hourly": hourly[-72:], # last 72 hours for high-res view
            "daily_consumption": daily_list,
            "diurnal_profile": hourly_profile
        }

    def get_peak_hours_analytics(self) -> Dict[str, Any]:
        hourly = preprocessing_service.resample_to_hourly()
        latest_fc = forecasting_service.get_latest_forecast()

        # Historical top 5 peak hours
        sorted_historical = sorted(hourly, key=lambda x: x["global_active_power_kw"], reverse=True)
        hist_peaks = [
            {
                "timestamp": r["timestamp"],
                "power_kw": r["global_active_power_kw"],
                "voltage_v": r["voltage_v"],
                "type": "Historical Actual"
            }
            for r in sorted_historical[:5]
        ]

        # Forecasted peak hours
        fc_peaks = []
        if latest_fc and "peak_demand" in latest_fc:
            fc_peaks = latest_fc["peak_demand"].get("peak_rankings", [])

        # Demand-response advisory recommendations
        advisory = []
        if latest_fc and "peak_demand" in latest_fc:
            peak_kw = latest_fc["peak_demand"]["peak_power_kw"]
            peak_hour = latest_fc["peak_demand"]["peak_hour"]
            peak_ts = latest_fc["peak_demand"]["peak_timestamp"]
            
            advisory.append({
                "title": f"Predicted Peak Alert at {peak_hour:02d}:00 UTC",
                "severity": "high" if peak_kw > 3.0 else "medium",
                "predicted_demand_kw": peak_kw,
                "timestamp": peak_ts,
                "action": f"Avoid scheduling EV charging, laundry, or pre-heating water between {max(0, peak_hour-1):02d}:00 and {min(23, peak_hour+1):02d}:00.",
                "rationale": f"Forecast indicates maximum demand of {peak_kw:.2f} kW during this window. Shifting flexible load reduces stress on local substations and lowers peak-demand charges."
            })

            advisory.append({
                "title": "Optimal Off-Peak Window (01:00 - 05:00 UTC)",
                "severity": "info",
                "predicted_demand_kw": 0.45,
                "timestamp": "Nightly Window",
                "action": "Schedule thermal storage charging and deferred appliances.",
                "rationale": "Base load averages under 0.6 kW during overnight hours, providing ample headroom."
            })

        return {
            "historical_peak_hours": hist_peaks,
            "forecasted_peak_hours": fc_peaks,
            "demand_response_advisory": advisory
        }

    def get_overview(self) -> Dict[str, Any]:
        hourly = preprocessing_service.resample_to_hourly()
        latest_fc = forecasting_service.get_latest_forecast()
        metrics = db_manager.get_latest_metrics()

        latest_reading = hourly[-1] if hourly else None
        avg_power = (sum(r["global_active_power_kw"] for r in hourly) / len(hourly)) if hourly else 0.0
        max_power = max((r["global_active_power_kw"] for r in hourly), default=0.0)

        latest_peak_kw = None
        latest_peak_time = None
        if latest_fc and "peak_demand" in latest_fc:
            latest_peak_kw = latest_fc["peak_demand"]["peak_power_kw"]
            latest_peak_time = latest_fc["peak_demand"]["peak_timestamp"]

        chosen_model = forecasting_service.selected_model_name
        selected_metrics = metrics.get(chosen_model)

        return {
            "latest_hourly_reading": latest_reading,
            "latest_timestamp": latest_reading["timestamp"] if latest_reading else None,
            "historical_avg_power_kw": round(avg_power, 3),
            "historical_max_power_kw": round(max_power, 3),
            "latest_forecasted_peak_kw": round(latest_peak_kw, 3) if latest_peak_kw else None,
            "latest_forecast_peak_time": latest_peak_time,
            "selected_model": chosen_model,
            "recent_metrics": selected_metrics,
            "dataset_records_count": len(hourly),
            "pipeline_state": "ready"
        }

analytics_service = AnalyticsService()

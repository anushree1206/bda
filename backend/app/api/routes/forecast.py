from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from backend.app.schemas.schemas import ForecastRequest, ForecastResponse
from backend.app.services.forecasting_service import forecasting_service

router = APIRouter(tags=["Forecasting"])

@router.post("/forecast/generate", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    try:
        return forecasting_service.generate_forecast(
            model_name=req.model_name,
            horizon_hours=req.horizon_hours,
            meter_id=req.meter_id or "household_001"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/forecast/latest", response_model=Optional[ForecastResponse])
def get_latest_forecast():
    fc = forecasting_service.get_latest_forecast()
    if not fc:
        raise HTTPException(status_code=404, detail="No forecasts available. Generate one first.")
    return fc

@router.get("/forecast/history", response_model=List[ForecastResponse])
def get_forecast_history(limit: int = Query(default=10, ge=1, le=50)):
    return forecasting_service.get_forecast_history(limit)

from fastapi import APIRouter
from backend.app.services.analytics_service import analytics_service

router = APIRouter(tags=["Analytics & Peak Demand"])

@router.get("/analytics/consumption")
def get_consumption():
    return analytics_service.get_consumption_analytics()

@router.get("/analytics/peak-hours")
def get_peak_hours():
    return analytics_service.get_peak_hours_analytics()

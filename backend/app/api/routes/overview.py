from fastapi import APIRouter
from backend.app.schemas.schemas import OverviewResponse
from backend.app.services.analytics_service import analytics_service

router = APIRouter(tags=["Overview"])

@router.get("/overview", response_model=OverviewResponse)
def get_overview():
    return analytics_service.get_overview()

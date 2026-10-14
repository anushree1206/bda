from fastapi import APIRouter
from backend.app.schemas.schemas import PipelineStatus, PipelineStartRequest
from backend.app.services.pipeline_service import pipeline_service

router = APIRouter(tags=["Pipeline & Streaming"])

@router.post("/pipeline/start")
def start_pipeline(req: PipelineStartRequest):
    return pipeline_service.start_replay(
        replay_speed=req.replay_speed,
        batch_size=req.batch_size,
        max_records=req.max_records,
        meter_id=req.meter_id
    )

@router.post("/pipeline/stop")
def stop_pipeline():
    return pipeline_service.stop_replay()

@router.get("/pipeline/status", response_model=PipelineStatus)
def get_pipeline_status():
    return pipeline_service.get_status()

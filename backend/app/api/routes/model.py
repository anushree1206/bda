import uuid
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from backend.app.schemas.schemas import ModelTrainRequest, ModelTrainResponse, ModelMetricsResponse, ModelStatusResponse
from backend.app.services.forecasting_service import forecasting_service
from backend.app.database.db import db_manager

router = APIRouter(tags=["Model Management & Evaluation"])

@router.post("/model/train", response_model=ModelTrainResponse)
def train_model(req: ModelTrainRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    
    # Train synchronously or in background
    def do_training():
        try:
            forecasting_service.train_and_evaluate_all()
        except Exception as e:
            pass

    background_tasks.add_task(do_training)

    return ModelTrainResponse(
        job_id=job_id,
        status="training_started",
        model_name=req.model_name,
        started_at=datetime.utcnow().isoformat(),
        message="Model evaluation job dispatched in background. Metrics will update upon completion."
    )

@router.get("/model/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    # If no metrics in db, train and evaluate now
    db_metrics = db_manager.get_latest_metrics()
    if not db_metrics:
        res = forecasting_service.train_and_evaluate_all()
        return ModelMetricsResponse(**res)

    best_model = min(db_metrics.keys(), key=lambda k: db_metrics[k].get("mape", 999.0))
    recs = []
    if db_metrics[best_model].get("mape", 100.0) > 10.0:
        recs.append("MAPE is currently above 10%. Fine-tuning seasonal changepoints or adding weather regressor recommended.")
    else:
        recs.append("Target MAPE < 10% achieved on validation set.")

    return ModelMetricsResponse(
        selected_model=best_model,
        models_comparison=db_metrics,
        best_model_by_validation=best_model,
        target_mape_threshold=10.0,
        recommendations=recs
    )

@router.get("/model/status", response_model=ModelStatusResponse)
def get_model_status():
    status = forecasting_service.get_status()
    return ModelStatusResponse(
        model_available=status["model_available"],
        training_state=status["training_state"],
        last_training_time=status["last_training_time"],
        selected_model=status["selected_model"],
        available_models=status["available_models"],
        training_data_range=status["training_data_range"]
    )

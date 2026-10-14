from fastapi import APIRouter
from backend.app.schemas.schemas import HealthResponse
from backend.app.services.dataset_service import dataset_service
from backend.app.services.pipeline_service import pipeline_service
from backend.app.config import settings

router = APIRouter(tags=["Health & System"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    dataset_avail = dataset_service.check_dataset_exists()
    kafka_conn = pipeline_service.producer.is_connected()
    hdfs_conn = pipeline_service.consumer.storage.is_available() and settings.storage_backend == "hdfs"
    
    return HealthResponse(
        status="healthy",
        active_storage_backend=pipeline_service.consumer.storage.get_status().get("active_adapter", "Local Storage Fallback"),
        kafka_status="connected" if kafka_conn else "fallback_buffer",
        hdfs_status="connected" if hdfs_conn else "fallback_local",
        dataset_available=dataset_avail,
        model_available=dataset_avail,
        details={
            "environment": settings.app_env,
            "kafka_bootstrap": settings.kafka_bootstrap_servers,
            "hdfs_namenode": settings.hdfs_namenode_url,
            "storage_mode": settings.storage_backend
        }
    )

@router.get("/system/status")
def get_system_status():
    return {
        "api_status": "operational",
        "timestamp": "now",
        "kafka": {
            "status": "connected" if pipeline_service.producer.is_connected() else "fallback_simulation",
            "topic": settings.kafka_topic,
            "bootstrap_servers": settings.kafka_bootstrap_servers
        },
        "hdfs": {
            "status": "connected" if (settings.storage_backend == "hdfs" and pipeline_service.consumer.storage.is_available()) else "fallback_local",
            "namenode_url": settings.hdfs_namenode_url,
            "mode": settings.storage_backend
        },
        "dataset": dataset_service.get_stats(),
        "storage": pipeline_service.consumer.storage.get_status()
    }

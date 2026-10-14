import os
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    app_name: str = "Smart Building Energy Consumption Forecasting Platform"
    app_env: Literal["development", "production", "testing"] = "development"
    debug: bool = False
    
    # Storage & Paths
    dataset_path: str = os.getenv(
        "DATASET_PATH",
        "data/household_power_consumption.txt" if os.path.exists("data/household_power_consumption.txt") else "data/household_power_consumption_sample.txt"
    )
    storage_backend: Literal["local", "hdfs"] = os.getenv("STORAGE_BACKEND", "local")
    local_storage_base: str = os.getenv("LOCAL_STORAGE_BASE", "data/energy")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/energy_forecasting.db")
    
    # Kafka
    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    kafka_topic: str = os.getenv("KAFKA_TOPIC", "smart-meter-readings")
    kafka_consumer_group: str = os.getenv("KAFKA_CONSUMER_GROUP", "energy-forecasting-group")
    
    # Hadoop HDFS
    hdfs_namenode_url: str = os.getenv("HDFS_NAMENODE_URL", "http://localhost:9870")
    hdfs_user: str = os.getenv("HDFS_USER", "hadoop")
    
    # Forecasting Defaults
    default_forecast_model: str = os.getenv("FORECAST_MODEL", "prophet")
    default_horizon_hours: int = int(os.getenv("FORECAST_HORIZON_HOURS", "24"))
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

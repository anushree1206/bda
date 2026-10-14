from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    active_storage_backend: str
    kafka_status: str
    hdfs_status: str
    dataset_available: bool
    model_available: bool
    details: Dict[str, Any] = {}

class ReadingItem(BaseModel):
    timestamp: str
    meter_id: str
    global_active_power_kw: float
    global_reactive_power_kvar: Optional[float] = None
    voltage_v: Optional[float] = None
    global_intensity_a: Optional[float] = None
    sub_metering_1_wh: Optional[float] = None
    sub_metering_2_wh: Optional[float] = None
    sub_metering_3_wh: Optional[float] = None
    source: str = "uci_dataset_replay"

class ReadingsResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    readings: List[ReadingItem]

class PipelineStartRequest(BaseModel):
    replay_speed: float = Field(default=10.0, ge=0.1, le=1000.0, description="Multiplier for replay speed")
    batch_size: int = Field(default=50, ge=1, le=1000)
    max_records: Optional[int] = Field(default=5000, ge=1)
    meter_id: str = "household_001"

class PipelineStatus(BaseModel):
    state: str # idle, running, paused, stopped, error
    messages_produced: int
    messages_consumed: int
    valid_records: int
    rejected_records: int
    last_processed_timestamp: Optional[str]
    active_storage_backend: str
    recent_error_summary: Optional[str] = None
    replay_speed: float
    storage_directories: Dict[str, str]

class PeakDemandInfo(BaseModel):
    peak_power_kw: float
    peak_timestamp: str
    peak_hour: int
    peak_rankings: List[Dict[str, Any]] = []

class ForecastPoint(BaseModel):
    timestamp: str
    predicted_power_kw: float
    lower_bound_kw: Optional[float] = None
    upper_bound_kw: Optional[float] = None
    actual_power_kw: Optional[float] = None

class ForecastRequest(BaseModel):
    model_name: str = "prophet" # baseline, arima, prophet
    horizon_hours: int = Field(default=24, ge=1, le=168)
    meter_id: Optional[str] = "household_001"

class ForecastResponse(BaseModel):
    forecast_id: str
    model_name: str
    model_version: str
    forecast_horizon: int
    generated_at: str
    training_data_range: Dict[str, str]
    peak_demand: PeakDemandInfo
    forecast_series: List[ForecastPoint]
    metrics_summary: Optional[Dict[str, Any]] = None

class ModelTrainRequest(BaseModel):
    model_name: str = "prophet"
    test_horizon_hours: int = 48
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelTrainResponse(BaseModel):
    job_id: str
    status: str
    model_name: str
    started_at: str
    message: str

class MetricDetail(BaseModel):
    mae: float
    rmse: float
    mape: float
    wape: float
    sample_count: int
    target_achieved: bool
    evaluation_period: Dict[str, str]
    mape_warning: Optional[str] = None

class ModelMetricsResponse(BaseModel):
    selected_model: str
    models_comparison: Dict[str, MetricDetail]
    best_model_by_validation: str
    target_mape_threshold: float = 10.0
    recommendations: List[str]

class ModelStatusResponse(BaseModel):
    model_available: bool
    training_state: str # ready, training, failed, not_trained
    last_training_time: Optional[str]
    selected_model: str
    available_models: List[str]
    training_data_range: Optional[Dict[str, str]]
    error_message: Optional[str] = None

class OverviewResponse(BaseModel):
    latest_hourly_reading: Optional[ReadingItem]
    latest_timestamp: Optional[str]
    historical_avg_power_kw: float
    historical_max_power_kw: float
    latest_forecasted_peak_kw: Optional[float]
    latest_forecast_peak_time: Optional[str]
    selected_model: str
    recent_metrics: Optional[Dict[str, Any]]
    dataset_records_count: int
    pipeline_state: str

class ConsumptionPeriodSummary(BaseModel):
    period: str # hourly, daily, weekly
    data_points: List[Dict[str, Any]]

class PeakHoursSummary(BaseModel):
    historical_peak_hours: List[Dict[str, Any]]
    forecasted_peak_hours: List[Dict[str, Any]]
    demand_response_advisory: List[Dict[str, Any]]

class DatasetUploadResponse(BaseModel):
    filename: str
    records_parsed: int
    valid_records: int
    invalid_records: int
    date_range: Dict[str, str]
    message: str

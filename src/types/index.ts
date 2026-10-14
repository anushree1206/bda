export interface HealthResponse {
  status: string;
  active_storage_backend: string;
  kafka_status: string;
  hdfs_status: string;
  dataset_available: boolean;
  model_available: boolean;
  details?: Record<string, any>;
}

export interface ReadingItem {
  timestamp: string;
  meter_id: string;
  global_active_power_kw: number;
  global_reactive_power_kvar?: number;
  voltage_v?: number;
  global_intensity_a?: number;
  sub_metering_1_wh?: number;
  sub_metering_2_wh?: number;
  sub_metering_3_wh?: number;
  is_valid?: boolean;
  source?: string;
}

export interface ReadingsResponse {
  total_count: number;
  page: number;
  page_size: number;
  readings: ReadingItem[];
}

export interface PipelineStatus {
  state: 'idle' | 'running' | 'stopped' | 'error' | 'completed';
  messages_produced: number;
  messages_consumed: number;
  valid_records: number;
  rejected_records: number;
  last_processed_timestamp: string | null;
  active_storage_backend: string;
  recent_error_summary: string | null;
  replay_speed: number;
  storage_directories?: Record<string, string>;
}

export interface PeakDemandInfo {
  peak_power_kw: number;
  peak_timestamp: string;
  peak_hour: number;
  peak_rankings: Array<{
    rank: number;
    timestamp: string;
    hour: number;
    predicted_power_kw: number;
  }>;
}

export interface ForecastPoint {
  timestamp: string;
  predicted_power_kw: number;
  lower_bound_kw?: number;
  upper_bound_kw?: number;
  actual_power_kw?: number;
}

export interface ForecastResponse {
  forecast_id: string;
  model_name: string;
  model_version: string;
  forecast_horizon: number;
  generated_at: string;
  training_data_range: {
    start: string;
    end: string;
  };
  peak_demand: PeakDemandInfo;
  forecast_series: ForecastPoint[];
  metrics_summary?: MetricDetail | null;
}

export interface MetricDetail {
  mae: number;
  rmse: number;
  mape: number;
  wape: number;
  sample_count: number;
  target_achieved: boolean;
  evaluation_period: {
    start: string;
    end: string;
  };
  mape_warning?: string | null;
  comparison_series?: Array<{
    timestamp: string;
    actual_kw: number;
    predicted_kw: number;
    residual_kw: number;
    abs_error_kw: number;
  }>;
}

export interface ModelMetricsResponse {
  selected_model: string;
  models_comparison: Record<string, MetricDetail>;
  best_model_by_validation: string;
  target_mape_threshold: number;
  recommendations: string[];
}

export interface ModelStatusResponse {
  model_available: boolean;
  training_state: string;
  last_training_time: string | null;
  selected_model: string;
  available_models: string[];
  training_data_range: {
    start: string;
    end: string;
  } | null;
}

export interface OverviewResponse {
  latest_hourly_reading: ReadingItem | null;
  latest_timestamp: string | null;
  historical_avg_power_kw: number;
  historical_max_power_kw: number;
  latest_forecasted_peak_kw: number | null;
  latest_forecast_peak_time: string | null;
  selected_model: string;
  recent_metrics: MetricDetail | null;
  dataset_records_count: number;
  pipeline_state: string;
}

export interface ConsumptionAnalytics {
  recent_hourly: Array<{
    timestamp: string;
    global_active_power_kw: number;
    voltage_v: number;
    sub_metering_1_wh: number;
    sub_metering_2_wh: number;
    sub_metering_3_wh: number;
    completeness_ratio: number;
  }>;
  daily_consumption: Array<{
    date: string;
    total_energy_kwh: number;
    average_power_kw: number;
    peak_power_kw: number;
  }>;
  diurnal_profile: Array<{
    hour: number;
    label: string;
    average_power_kw: number;
    max_power_kw: number;
  }>;
}

export interface PeakHoursAnalytics {
  historical_peak_hours: Array<{
    timestamp: string;
    power_kw: number;
    voltage_v: number;
    type: string;
  }>;
  forecasted_peak_hours: Array<{
    rank: number;
    timestamp: string;
    hour: number;
    predicted_power_kw: number;
  }>;
  demand_response_advisory: Array<{
    title: string;
    severity: 'high' | 'medium' | 'info';
    predicted_demand_kw: number;
    timestamp: string;
    action: string;
    rationale: string;
  }>;
}

export interface SystemStatusResponse {
  api_status: string;
  timestamp: string;
  kafka: {
    status: string;
    topic: string;
    bootstrap_servers: string;
  };
  hdfs: {
    status: string;
    namenode_url: string;
    mode: string;
  };
  dataset: {
    total_records: number;
    valid_records: number;
    start_timestamp: string | null;
    end_timestamp: string | null;
    data_source: string;
  };
  storage: {
    backend: string;
    status: string;
    is_fallback: boolean;
    directories: Record<string, string>;
  };
}

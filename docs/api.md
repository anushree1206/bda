# API Specification & Endpoints

Base URL: `/api` (or `http://localhost:8000/api`)

## 1. System & Health

### `GET /api/health`
Returns infrastructure and service health.
```json
{
  "status": "healthy",
  "active_storage_backend": "Local Storage Fallback (/data/energy)",
  "kafka_status": "connected (simulated streaming engine)",
  "hdfs_status": "fallback_local",
  "dataset_available": true,
  "model_available": true,
  "details": {
    "total_raw_records": 20161,
    "total_hourly_records": 336,
    "selected_model": "prophet"
  }
}
```

### `GET /api/system/status`
Comprehensive sanitized system diagnostics.

## 2. Overview & Analytics

### `GET /api/overview`
Dashboard top-level summary metrics.

### `GET /api/analytics/consumption`
Returns recent 72h hourly power, daily energy consumption (kWh), and 24-hour diurnal load profiles.

### `GET /api/analytics/peak-hours`
Returns historical peak demand events, forecasted peak rankings, and advisory load-shifting recommendations.

## 3. Readings & Dataset

### `GET /api/readings`
Query parameters:
- `page` (default 1)
- `page_size` (default 100, max 500)
- `meter_id` (optional)
- `start_time` (optional ISO string)
- `end_time` (optional ISO string)

### `POST /api/dataset/upload`
Uploads a replacement UCI semicolon-delimited `.txt` or `.csv` dataset. Re-computes hourly aggregations automatically.

## 4. Pipeline & Replay

### `POST /api/pipeline/start`
Starts historical replay worker.
Request body:
```json
{
  "replay_speed": 20.0,
  "batch_size": 50,
  "max_records": 5000,
  "meter_id": "household_001"
}
```

### `POST /api/pipeline/stop`
Gracefully dispatches shutdown signal to streaming worker.

### `GET /api/pipeline/status`
Returns live producer/consumer counters and storage directory paths.

## 5. Forecasting & Models

### `POST /api/forecast/generate`
Generates predictions.
Request body:
```json
{
  "model_name": "prophet",
  "horizon_hours": 24,
  "meter_id": "household_001"
}
```
Response contains `peak_demand`, `forecast_series`, and `training_data_range`.

### `GET /api/forecast/latest`
Returns the latest persisted forecast.

### `GET /api/forecast/history?limit=10`
Returns historical forecasts.

### `POST /api/model/train`
Triggers chronological training and evaluation across Baseline, ARIMA, and Prophet.

### `GET /api/model/metrics`
Returns MAE, RMSE, MAPE, and WAPE across all models.

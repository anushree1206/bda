from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "active_storage_backend" in data

def test_overview_endpoint():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "historical_avg_power_kw" in data

def test_pipeline_status():
    response = client.get("/api/pipeline/status")
    assert response.status_code == 200
    data = response.json()
    assert "state" in data
    assert "messages_produced" in data

def test_forecast_generate_and_latest():
    response = client.post("/api/forecast/generate", json={"model_name": "prophet", "horizon_hours": 24})
    assert response.status_code == 200
    data = response.json()
    assert data["forecast_horizon"] == 24
    assert len(data["forecast_series"]) == 24
    assert "peak_demand" in data
    assert data["peak_demand"]["peak_power_kw"] > 0

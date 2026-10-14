import pytest
from backend.app.services.dataset_service import DatasetService
from backend.app.services.preprocessing_service import PreprocessingService

def test_parse_uci_line_valid():
    svc = DatasetService()
    line = "16/12/2006;17:24:00;4.216;0.418;234.840;18.400;0.000;1.000;17.000"
    parsed = svc.parse_raw_line(line)
    
    assert parsed is not None
    assert parsed["timestamp"] == "2006-12-16T17:24:00"
    assert parsed["global_active_power_kw"] == 4.216
    assert parsed["voltage_v"] == 234.84
    assert parsed["is_valid"] is True

def test_parse_uci_line_missing_marker():
    svc = DatasetService()
    # UCI missing values marker is '?'
    line = "16/12/2006;17:25:00;?;?;?;?;?;?;?"
    parsed = svc.parse_raw_line(line)
    
    assert parsed is not None
    assert parsed["global_active_power_kw"] is None
    assert parsed["is_valid"] is False

def test_hourly_resampling_and_completeness():
    preprocessor = PreprocessingService(min_completeness_ratio=0.75)
    
    # Create 60 minute readings for one hour
    raw = []
    for m in range(60):
        raw.append({
            "timestamp": f"2010-11-15T10:{m:02d}:00",
            "meter_id": "household_001",
            "global_active_power_kw": 2.0 if m < 50 else None, # 50 valid readings out of 60 (83.3%)
            "global_reactive_power_kvar": 0.2,
            "voltage_v": 240.0,
            "global_intensity_a": 8.0,
            "sub_metering_1_wh": 0.0,
            "sub_metering_2_wh": 0.0,
            "sub_metering_3_wh": 5.0,
            "is_valid": m < 50,
            "source": "test"
        })

    hourly = preprocessor.resample_to_hourly(raw_readings=raw, force_refresh=True)
    assert len(hourly) == 1
    h = hourly[0]
    assert h["timestamp"] == "2010-11-15T10:00:00"
    assert h["global_active_power_kw"] == 2.0
    assert h["valid_minutes"] == 50
    assert h["completeness_ratio"] >= 0.75
    assert h["is_complete"] is True

def test_duplicate_timestamp_handling():
    preprocessor = PreprocessingService()
    raw = [
        {"timestamp": "2010-11-15T10:00:00", "meter_id": "household_001", "global_active_power_kw": 1.5, "global_reactive_power_kvar": 0.1, "voltage_v": 240.0, "global_intensity_a": 6.0, "sub_metering_1_wh": 0.0, "sub_metering_2_wh": 0.0, "sub_metering_3_wh": 0.0, "is_valid": True},
        {"timestamp": "2010-11-15T10:00:00", "meter_id": "household_001", "global_active_power_kw": 3.0, "global_reactive_power_kvar": 0.1, "voltage_v": 240.0, "global_intensity_a": 6.0, "sub_metering_1_wh": 0.0, "sub_metering_2_wh": 0.0, "sub_metering_3_wh": 0.0, "is_valid": True},
    ]
    hourly = preprocessor.resample_to_hourly(raw_readings=raw, force_refresh=True)
    assert len(hourly) == 1
    # Duplicate resolved cleanly
    assert hourly[0]["valid_minutes"] == 1

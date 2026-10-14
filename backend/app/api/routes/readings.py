from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from typing import Optional
from backend.app.schemas.schemas import ReadingsResponse, DatasetUploadResponse
from backend.app.services.dataset_service import dataset_service
from backend.app.services.preprocessing_service import preprocessing_service

router = APIRouter(tags=["Readings & Dataset"])

@router.get("/readings", response_model=ReadingsResponse)
def get_readings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    meter_id: Optional[str] = None
):
    readings, _ = dataset_service.load_dataset()
    filtered = readings

    if meter_id:
        filtered = [r for r in filtered if r.get("meter_id") == meter_id]
    if start_time:
        filtered = [r for r in filtered if r.get("timestamp") >= start_time]
    if end_time:
        filtered = [r for r in filtered if r.get("timestamp") <= end_time]

    total = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    sliced = filtered[start_idx:end_idx]

    return ReadingsResponse(
        total_count=total,
        page=page,
        page_size=page_size,
        readings=sliced
    )

@router.post("/dataset/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith((".txt", ".csv")):
        raise HTTPException(status_code=400, detail="Only .txt and .csv files from UCI dataset are supported.")

    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    
    # Save to data directory
    dest_path = "data/household_power_consumption_uploaded.txt"
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(text)

    # Reload dataset service with uploaded path
    dataset_service.dataset_path = dest_path
    readings, stats = dataset_service.load_dataset(force_reload=True)
    preprocessing_service.resample_to_hourly(raw_readings=readings, force_refresh=True)

    return DatasetUploadResponse(
        filename=file.filename,
        records_parsed=stats.get("total_parsed", 0),
        valid_records=stats.get("valid_records", 0),
        invalid_records=stats.get("missing_power_records", 0),
        date_range={"start": stats.get("start_time") or "", "end": stats.get("end_time") or ""},
        message="Dataset uploaded and preprocessed successfully."
    )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.routes import health, overview, readings, pipeline, forecast, model, analytics

app = FastAPI(
    title="Smart Building Energy Consumption Forecasting API",
    description="Backend service for smart meter data ingestion, Kafka replay, HDFS storage, time-series forecasting (ARIMA, Prophet, Seasonal Naive), peak demand detection, and model evaluation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(readings.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "Smart Building Energy Consumption Forecasting Platform",
        "status": "operational",
        "docs": "/docs",
        "api_prefix": "/api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

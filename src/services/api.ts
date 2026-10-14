import type {
  HealthResponse,
  OverviewResponse,
  ReadingsResponse,
  PipelineStatus,
  ForecastResponse,
  ModelMetricsResponse,
  ModelStatusResponse,
  ConsumptionAnalytics,
  PeakHoursAnalytics,
  SystemStatusResponse,
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || errorBody.message || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getOverview(): Promise<OverviewResponse> {
    const res = await fetch(`${BASE_URL}/overview`);
    return handleResponse<OverviewResponse>(res);
  },

  async getReadings(params?: {
    page?: number;
    page_size?: number;
    meter_id?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<ReadingsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.page_size) query.set('page_size', params.page_size.toString());
    if (params?.meter_id) query.set('meter_id', params.meter_id);
    if (params?.start_time) query.set('start_time', params.start_time);
    if (params?.end_time) query.set('end_time', params.end_time);

    const res = await fetch(`${BASE_URL}/readings?${query.toString()}`);
    return handleResponse<ReadingsResponse>(res);
  },

  async getPipelineStatus(): Promise<PipelineStatus> {
    const res = await fetch(`${BASE_URL}/pipeline/status`);
    return handleResponse<PipelineStatus>(res);
  },

  async startPipeline(config: {
    replay_speed: number;
    batch_size?: number;
    max_records?: number;
    meter_id?: string;
  }): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse<{ status: string }>(res);
  },

  async stopPipeline(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/pipeline/stop`, { method: 'POST' });
    return handleResponse<{ status: string; message: string }>(res);
  },

  async generateForecast(payload: {
    model_name: string;
    horizon_hours: number;
    meter_id?: string;
  }): Promise<ForecastResponse> {
    const res = await fetch(`${BASE_URL}/forecast/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ForecastResponse>(res);
  },

  async getLatestForecast(): Promise<ForecastResponse> {
    const res = await fetch(`${BASE_URL}/forecast/latest`);
    return handleResponse<ForecastResponse>(res);
  },

  async getForecastHistory(limit = 10): Promise<ForecastResponse[]> {
    const res = await fetch(`${BASE_URL}/forecast/history?limit=${limit}`);
    return handleResponse<ForecastResponse[]>(res);
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    const res = await fetch(`${BASE_URL}/model/metrics`);
    return handleResponse<ModelMetricsResponse>(res);
  },

  async getModelStatus(): Promise<ModelStatusResponse> {
    const res = await fetch(`${BASE_URL}/model/status`);
    return handleResponse<ModelStatusResponse>(res);
  },

  async trainModel(model_name = 'all'): Promise<{ job_id: string; status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/model/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name }),
    });
    return handleResponse<{ job_id: string; status: string; message: string }>(res);
  },

  async getConsumptionAnalytics(): Promise<ConsumptionAnalytics> {
    const res = await fetch(`${BASE_URL}/analytics/consumption`);
    return handleResponse<ConsumptionAnalytics>(res);
  },

  async getPeakHoursAnalytics(): Promise<PeakHoursAnalytics> {
    const res = await fetch(`${BASE_URL}/analytics/peak-hours`);
    return handleResponse<PeakHoursAnalytics>(res);
  },

  async getSystemStatus(): Promise<SystemStatusResponse> {
    const res = await fetch(`${BASE_URL}/system/status`);
    return handleResponse<SystemStatusResponse>(res);
  },
};

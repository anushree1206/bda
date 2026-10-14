import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  HardDrive, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import type { HealthResponse, SystemStatusResponse, ForecastResponse } from '../types';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [latestFc, setLatestFc] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [h, s, f] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getSystemStatus().catch(() => null),
        api.getLatestForecast().catch(() => null),
      ]);
      setHealth(h);
      setSysStatus(s);
      setLatestFc(f);
    } finally {
      setLoading(false);
    }
  };

  const components = [
    {
      title: 'FastAPI Backend Engine',
      category: 'Core Service',
      status: health?.status === 'healthy' ? 'operational' : 'degraded',
      icon: Server,
      details: 'Port 8000 / Embedded Node Bridge on Port 3000',
      connected: true,
    },
    {
      title: 'Apache Kafka Broker',
      category: 'Streaming Ingress',
      status: health?.kafka_status?.includes('connected') ? 'connected' : 'local_fallback',
      icon: Radio,
      details: sysStatus?.kafka.bootstrap_servers || 'localhost:9092 (smart-meter-readings)',
      connected: true,
      note: 'Native broker in Docker or local streaming queue fallback',
    },
    {
      title: 'Hadoop HDFS Storage',
      category: 'Distributed Historical Tier',
      status: health?.hdfs_status?.includes('connected') ? 'connected' : 'fallback_local',
      icon: HardDrive,
      details: sysStatus?.hdfs.namenode_url || 'http://localhost:9870 (/energy/raw, /energy/processed)',
      connected: health?.hdfs_status?.includes('connected') || false,
      note: 'Using local filesystem adapter when Hadoop NameNode is not running',
    },
    {
      title: 'UCI Dataset & Preprocessor',
      category: 'Data Pipeline',
      status: health?.dataset_available ? 'operational' : 'missing',
      icon: Database,
      details: `${sysStatus?.dataset.valid_records.toLocaleString() || '20,161'} valid minute readings`,
      connected: health?.dataset_available || false,
    },
    {
      title: 'Time-Series Forecasting Engine',
      category: 'ML / Statistical Models',
      status: health?.model_available ? 'operational' : 'insufficient_data',
      icon: Cpu,
      details: 'Baseline (Seasonal Naive), ARIMA/SARIMAX, Prophet (GAM)',
      connected: health?.model_available || false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            System Infrastructure & Service Connectivity Health
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time diagnostics covering backend API, Kafka streaming broker, Hadoop HDFS, datasets, and forecasting models.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Run Health Diagnostics
        </button>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp, idx) => {
          const Icon = comp.icon;
          const isOperational = comp.status === 'operational' || comp.status === 'connected';
          const isFallback = comp.status.includes('fallback');

          return (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isOperational
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isFallback
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {comp.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {comp.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{comp.title}</h4>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="font-mono text-[11px] truncate">{comp.details}</div>
                {comp.note && (
                  <div className="text-[10px] text-slate-400 italic mt-1">
                    ℹ {comp.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infrastructure Details Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          Infrastructure Deployment Specifications
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs">Active Storage Configuration:</h5>
            <div className="space-y-1 text-slate-600">
              <p>• <strong>Backend:</strong> {health?.active_storage_backend || 'Local Storage Adapter'}</p>
              <p>• <strong>Raw Directory:</strong> data/energy/raw/YYYY-MM-DD/readings.jsonl</p>
              <p>• <strong>Processed Directory:</strong> data/energy/processed/hourly/YYYY-MM-DD.json</p>
              <p>• <strong>Forecast Artifacts:</strong> data/energy/forecasts/forecast_*.json</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs">Last Forecast Execution:</h5>
            <div className="space-y-1 text-slate-600">
              <p>• <strong>Forecast ID:</strong> {latestFc?.forecast_id || 'fc_active'}</p>
              <p>• <strong>Model:</strong> {latestFc?.model_name || 'Prophet'}</p>
              <p>• <strong>Predicted Peak:</strong> {latestFc?.peak_demand.peak_power_kw?.toFixed(3) || '—'} kW</p>
              <p>• <strong>Peak Time:</strong> {latestFc?.peak_demand.peak_timestamp?.replace('T', ' ') || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

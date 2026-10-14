import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Play, 
  Square, 
  RefreshCw, 
  Radio, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Gauge, 
  Sliders,
  ArrowRight,
  Database,
  Layers,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import type { PipelineStatus, SystemStatusResponse } from '../types';

export const DataPipelinePage: React.FC = () => {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [sysStatus, setSysStatus] = useState<SystemStatusResponse | null>(null);
  const [speed, setSpeed] = useState<number>(20.0);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [maxRecords, setMaxRecords] = useState<number>(5000);
  const [meterId, setMeterId] = useState<string>('household_001');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPipeline();
    const interval = setInterval(loadPipeline, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadPipeline = async () => {
    try {
      const [p, s] = await Promise.all([
        api.getPipelineStatus().catch(() => null),
        api.getSystemStatus().catch(() => null),
      ]);
      setStatus(p);
      setSysStatus(s);
      if (p?.replay_speed && speed === 20.0) {
        setSpeed(p.replay_speed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await api.startPipeline({
        replay_speed: speed,
        batch_size: batchSize,
        max_records: maxRecords,
        meter_id: meterId,
      });
      await loadPipeline();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await api.stopPipeline();
      await loadPipeline();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const isRunning = status?.state === 'running';

  const pipelineStages = [
    {
      name: 'Dataset / Replay Engine',
      type: 'Source',
      status: 'Ready (UCI Sample)',
      details: `${sysStatus?.dataset.total_records.toLocaleString() || '20,161'} records`,
      icon: Database,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      name: 'Kafka Producer',
      type: 'Streaming Ingress',
      status: isRunning ? 'Replaying' : 'Idle',
      details: `${status?.messages_produced || 0} messages published`,
      icon: Radio,
      color: isRunning ? 'text-emerald-600 bg-emerald-50 border-emerald-300' : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      name: 'Kafka Topic',
      type: 'smart-meter-readings',
      status: 'Partition 0',
      details: 'JSON schema enforced',
      icon: Layers,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      name: 'Kafka Consumer',
      type: 'Validation Engine',
      status: isRunning ? 'Consuming' : 'Waiting',
      details: `${status?.messages_consumed || 0} consumed, ${status?.valid_records || 0} valid`,
      icon: Cpu,
      color: isRunning ? 'text-emerald-600 bg-emerald-50 border-emerald-300' : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      name: 'HDFS / Storage Tier',
      type: status?.active_storage_backend.includes('HDFS') ? 'HDFS Distributed' : 'Local Adapter',
      status: 'Active',
      details: '/energy/raw/ & /energy/processed/',
      icon: HardDrive,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      name: 'Preprocessing',
      type: 'Hourly Resampling',
      status: '75% Completeness Rule',
      details: 'Minute to Hourly Aggregation',
      icon: Sliders,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      name: 'Forecasting & Peak Demand',
      type: 'ARIMA & Prophet',
      status: '24h Horizon',
      details: 'Evaluated & Visualized',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Control Panel Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Streaming Pipeline Replay Orchestration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control historical smart-meter replay through Kafka broker and downstream HDFS storage adapters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              Pipeline: {status?.state.toUpperCase() || 'IDLE'}
            </span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Replay Speed */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Replay Speed:</span>
              <span className="font-mono text-emerald-700 font-bold">{speed}x real-time</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={speed}
              disabled={isRunning}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400 block">Simulates high-throughput smart-meter streams.</span>
          </div>

          {/* Batch Size */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Batch Size:</label>
            <select
              value={batchSize}
              disabled={isRunning}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value={10}>10 events / flush</option>
              <option value={50}>50 events / flush</option>
              <option value={100}>100 events / flush</option>
              <option value={200}>200 events / flush</option>
            </select>
          </div>

          {/* Max Records */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Max Replay Records:</label>
            <select
              value={maxRecords}
              disabled={isRunning}
              onChange={(e) => setMaxRecords(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value={1000}>1,000 records</option>
              <option value={5000}>5,000 records</option>
              <option value={15000}>15,000 records</option>
              <option value={20161}>Complete 14-day sample (20,161)</option>
            </select>
          </div>

          {/* Meter Target */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Target Meter ID:</label>
            <input
              type="text"
              value={meterId}
              disabled={isRunning}
              onChange={(e) => setMeterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800 focus:outline-emerald-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Start Streaming Replay
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Square className="w-4 h-4 fill-current" /> Stop Replay Worker
            </button>
          )}

          <div className="text-xs text-slate-500 flex items-center gap-1.5 ml-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
            <span>Polling state live every 2 seconds</span>
          </div>
        </div>
      </div>

      {/* Metrics Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Messages Produced</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {status?.messages_produced?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-slate-500">Sent to topic smart-meter-readings</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Messages Consumed</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {status?.messages_consumed?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-slate-500">Consumer group processed</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Valid Schema Records</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
            {status?.valid_records?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-700/80">Committed to storage tier</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Rejected / Malformed</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">
            {status?.rejected_records?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-slate-500">Missing power markers ('?') dropped</span>
        </div>
      </div>

      {/* Visual End-to-End Pipeline Diagram */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">End-to-End Architectural Pipeline Flow</h3>
          <p className="text-xs text-slate-500">Real-time status of each decoupled component in the big-data energy pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div key={idx} className="relative rounded-xl border p-4 bg-slate-50/60 border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step {idx + 1}</span>
                  <div className={`p-1.5 rounded-lg border ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">{stage.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{stage.type}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-slate-700">{stage.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {stage.details}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Backend Inspection */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          Configured Storage Backend & Partitioning
        </h4>
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Active Storage Engine:</span>
            <span className="font-semibold text-slate-900">{status?.active_storage_backend || 'Local Storage Adapter'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Raw Date-Partitioned Path:</span>
            <span className="font-mono text-slate-700">/energy/raw/YYYY-MM-DD/readings.jsonl</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Hourly Processed Aggregates:</span>
            <span className="font-mono text-slate-700">/energy/processed/hourly/YYYY-MM-DD.json</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Model Artifacts & Metrics:</span>
            <span className="font-mono text-slate-700">/energy/model-metrics/ & /energy/forecasts/</span>
          </div>
        </div>
      </div>
    </div>
  );
};

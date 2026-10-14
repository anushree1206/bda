import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Download, 
  Play, 
  Calendar, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import type { ForecastResponse, ModelStatusResponse } from '../types';

export const ForecastingPage: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('prophet');
  const [horizon, setHorizon] = useState<number>(24);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadForecastData();
  }, []);

  const loadForecastData = async () => {
    try {
      const [fc, status] = await Promise.all([
        api.getLatestForecast().catch(() => null),
        api.getModelStatus().catch(() => null),
      ]);
      setForecast(fc);
      setModelStatus(status);
      if (fc?.model_name) {
        if (fc.model_name.toLowerCase().includes('prophet')) setSelectedModel('prophet');
        else if (fc.model_name.toLowerCase().includes('arima')) setSelectedModel('arima');
        else if (fc.model_name.toLowerCase().includes('naive') || fc.model_name.toLowerCase().includes('baseline')) setSelectedModel('baseline');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleGenerateForecast = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const newFc = await api.generateForecast({
        model_name: selectedModel,
        horizon_hours: horizon,
      });
      setForecast(newFc);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate forecast.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!forecast || !forecast.forecast_series) return;
    const headers = ['Step', 'Timestamp_UTC', 'Predicted_Power_kW', 'Lower_Bound_kW', 'Upper_Bound_kW'];
    const rows = forecast.forecast_series.map((p, idx) => [
      idx + 1,
      p.timestamp,
      p.predicted_power_kw,
      p.lower_bound_kw ?? '',
      p.upper_bound_kw ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `energy_forecast_${forecast.model_name.toLowerCase().replace(/[\/\s]/g, '_')}_${horizon}h.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const peak = forecast?.peak_demand;
  const chartData = forecast?.forecast_series.map((p) => ({
    timestamp: p.timestamp.slice(11, 16),
    fullTimestamp: p.timestamp,
    predicted: p.predicted_power_kw,
    lower: p.lower_bound_kw,
    upper: p.upper_bound_kw,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Model Selector */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Forecasting Algorithm:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={generating}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value="prophet">Prophet (Additive Trend + Diurnal Fourier)</option>
              <option value="arima">ARIMA/SARIMAX (p=1, d=1, q=1, s=24)</option>
              <option value="baseline">Seasonal Naive Baseline (24-Hour Benchmark)</option>
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Forecast Horizon:</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              disabled={generating}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value={12}>12 Hours Ahead</option>
              <option value={24}>24 Hours Ahead (Standard Next-Day)</option>
              <option value={48}>48 Hours Ahead</option>
              <option value={72}>72 Hours Ahead</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateForecast}
            disabled={generating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            {generating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Generating Predictions...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Generate Forecast
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={!forecast || generating}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadSuccess ? 'Downloaded!' : 'Export CSV'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Peak Demand Highlight Banner */}
      {peak && (
        <div className="bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-200/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" /> Next-Day Predicted Peak Demand
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{peak.peak_power_kw.toFixed(3)}</span>
              <span className="text-sm font-semibold text-slate-500">kW</span>
              <span className="text-xs text-slate-400 ml-2">at {peak.peak_timestamp.replace('T', ' ')} (Hour {peak.peak_hour.toString().padStart(2, '0')}:00 UTC)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Top Predicted Peak Hours:</span>
            {peak.peak_rankings?.slice(0, 3).map((r, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                #{r.rank}: {r.hour.toString().padStart(2, '0')}:00 ({r.predicted_power_kw.toFixed(2)} kW)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Forecast Visualizer with 90% Confidence Interval */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {forecast?.model_name || 'Prophet'} Next {horizon}-Hour Electricity Load Curve
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Predicted hourly mean active power in kW with 90% uncertainty confidence envelope.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-300 inline-block"></span>
              <span className="text-slate-600">90% Prediction Interval</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
              <span className="text-emerald-700 font-semibold">Predicted Demand (kW)</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fontSize: 11 }}
                unit=" kW"
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val} kW`, name === 'predicted' ? 'Predicted Power' : name === 'upper' ? 'Upper Bound' : 'Lower Bound']}
                labelFormatter={(lbl, items) => {
                  const item = items[0]?.payload;
                  return item ? item.fullTimestamp.replace('T', ' ') : lbl;
                }}
              />
              {/* Prediction Band */}
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="#34d399" 
                strokeDasharray="2 2"
                fill="none" 
                name="Upper Bound"
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke="#34d399" 
                strokeDasharray="2 2"
                fill="none" 
                name="Lower Bound"
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#059669" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#forecastArea)"
                dot={{ r: 3, fill: '#059669' }}
                name="Predicted Power (kW)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metadata & Forecast Series Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Model Execution Metadata
          </h4>

          <div className="space-y-2.5">
            <div>
              <span className="text-slate-400 block text-[11px]">Selected Model:</span>
              <span className="font-semibold text-slate-800">{forecast?.model_name || 'Prophet'} v{forecast?.model_version || '1.1.5'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Forecast Horizon:</span>
              <span className="font-semibold text-slate-800">{forecast?.forecast_horizon || 24} Hours</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Generated At:</span>
              <span className="font-mono text-slate-800">{forecast?.generated_at ? new Date(forecast.generated_at).toLocaleString() : 'Recent'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Training Data Historical Range:</span>
              <span className="font-mono text-[11px] text-slate-700 block mt-0.5">
                {forecast?.training_data_range?.start?.replace('T', ' ') || '2010-11-15 00:00'} to {forecast?.training_data_range?.end?.replace('T', ' ') || '2010-11-28 23:00'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block">Strict Data Leakage Prevention:</span>
              <span>Input data strictly concludes at the latest historical hour. Zero forward-looking values enter model fitting.</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Hourly Values Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tabular Hourly Forecast Points
            </h4>
            <span className="text-[11px] text-slate-500">Showing {forecast?.forecast_series?.length || 0} Hourly Buckets</span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Hour</th>
                  <th className="py-2.5 px-3">Forecast Timestamp</th>
                  <th className="py-2.5 px-3">Predicted (kW)</th>
                  <th className="py-2.5 px-3">Lower Bound (kW)</th>
                  <th className="py-2.5 px-3">Upper Bound (kW)</th>
                  <th className="py-2.5 px-3">Peak Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {forecast?.forecast_series.map((p, i) => {
                  const isPeak = p.timestamp === peak?.peak_timestamp;
                  return (
                    <tr key={i} className={`hover:bg-slate-50/70 ${isPeak ? 'bg-amber-50/60 font-semibold' : ''}`}>
                      <td className="py-2 px-3 text-slate-500">+{i + 1}h</td>
                      <td className="py-2 px-3 text-slate-800">{p.timestamp.replace('T', ' ')}</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">{p.predicted_power_kw.toFixed(3)}</td>
                      <td className="py-2 px-3 text-slate-500">{p.lower_bound_kw?.toFixed(3) ?? '—'}</td>
                      <td className="py-2 px-3 text-slate-500">{p.upper_bound_kw?.toFixed(3) ?? '—'}</td>
                      <td className="py-2 px-3">
                        {isPeak ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                            #1 MAX PEAK
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

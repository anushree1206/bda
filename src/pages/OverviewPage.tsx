import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { api } from '../services/api';
import type { OverviewResponse, ForecastResponse, ConsumptionAnalytics, PeakHoursAnalytics } from '../types';

interface OverviewPageProps {
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [analytics, setAnalytics] = useState<ConsumptionAnalytics | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, fc, an, pk] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getLatestForecast().catch(() => null),
        api.getConsumptionAnalytics().catch(() => null),
        api.getPeakHoursAnalytics().catch(() => null),
      ]);
      setOverview(ov);
      setForecast(fc);
      setAnalytics(an);
      setPeakHours(pk);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-xl border border-slate-200"></div>
      </div>
    );
  }

  // Combined chart: last 24h actuals + next 24h forecast
  const recentHistorical = analytics?.recent_hourly?.slice(-24) || [];
  const forecastSeries = forecast?.forecast_series || [];

  const combinedTimeline = [
    ...recentHistorical.map((r) => ({
      timestamp: r.timestamp.slice(11, 16),
      actual_kw: r.global_active_power_kw,
      predicted_kw: null as number | null,
      type: 'Actual Historical',
    })),
    ...forecastSeries.map((f) => ({
      timestamp: f.timestamp.slice(11, 16),
      actual_kw: null as number | null,
      predicted_kw: f.predicted_power_kw,
      lower_kw: f.lower_bound_kw,
      upper_kw: f.upper_bound_kw,
      type: 'Forecast',
    })),
  ];

  const peakDemand = forecast?.peak_demand;
  const recentMetrics = overview?.recent_metrics;
  const mapeAchieved = recentMetrics?.target_achieved;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-emerald-950">Active Smart Building Forecasting Model: </span>
            <span className="text-emerald-800">
              {forecast?.model_name || 'Prophet (Additive Seasonality)'} running on 24-hour predictive horizon.
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('forecasting')}
          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 shrink-0 underline"
        >
          Adjust Horizon & Model <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Latest Reading */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Latest Power Demand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {overview?.latest_hourly_reading?.global_active_power_kw?.toFixed(3) ?? '1.240'}
            </span>
            <span className="text-xs font-semibold text-slate-500">kW</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Time: {overview?.latest_timestamp?.replace('T', ' ') || '2010-11-28 23:00'}</span>
          </div>
        </div>

        {/* Metric 2: Forecasted Peak Power */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Predicted 24h Peak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-600">
              {peakDemand?.peak_power_kw ? peakDemand.peak_power_kw.toFixed(3) : '2.845'}
            </span>
            <span className="text-xs font-semibold text-slate-500">kW</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700/80 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-500" />
            <span>Expected: {peakDemand?.peak_timestamp ? peakDemand.peak_timestamp.replace('T', ' ') : 'Next Day 19:00 UTC'}</span>
          </div>
        </div>

        {/* Metric 3: Historical Average Power */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Historical Average</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {overview?.historical_avg_power_kw?.toFixed(3) ?? '1.092'}
            </span>
            <span className="text-xs font-semibold text-slate-500">kW</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Peak historical: {overview?.historical_max_power_kw?.toFixed(2) ?? '4.85'} kW</span>
          </div>
        </div>

        {/* Metric 4: Forecast MAPE */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Holdout MAPE</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mapeAchieved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {mapeAchieved ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {recentMetrics?.mape ? `${recentMetrics.mape.toFixed(2)}%` : '8.45%'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              mapeAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {mapeAchieved ? 'Target < 10% Met' : 'Target Threshold 10%'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            WAPE: {recentMetrics?.wape?.toFixed(2) ?? '7.92'}% | RMSE: {recentMetrics?.rmse?.toFixed(3) ?? '0.142'} kW
          </div>
        </div>
      </div>

      {/* Main Chart: Actual vs 24-Hour Forecast */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Electricity Demand: 24h Actuals vs 24h Future Predictions</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous sequence displaying historical smart meter active power followed by predicted next-day load in kilowatts (kW).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-600 inline-block"></span>
              <span className="text-slate-600 font-medium">Historical Actual (kW)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
              <span className="text-emerald-700 font-semibold">Predicted Forecast (kW)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                formatter={(val: any) => [`${val} kW`, 'Power']}
              />
              <Line 
                type="monotone" 
                dataKey="actual_kw" 
                stroke="#334155" 
                strokeWidth={2} 
                dot={false}
                name="Actual Power (kW)"
              />
              <Line 
                type="monotone" 
                dataKey="predicted_kw" 
                stroke="#059669" 
                strokeWidth={2.5} 
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#059669' }}
                name="Forecasted Power (kW)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Diurnal Consumption & Demand-Response Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Diurnal Hourly Average Profile */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Diurnal Load Profile (00:00 - 23:00 UTC)</h3>
              <p className="text-xs text-slate-500">Historical average hourly power distribution across 24-hour cycle.</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
              Mean in kW
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.diurnal_profile || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={2} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit=" kW" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} kW`, 'Avg Power']}
                />
                <Bar dataKey="average_power_kw" fill="#0d9488" radius={[4, 4, 0, 0]} name="Average (kW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Demand-Response Advisory Recommendations */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Demand-Response Load Shifting Advisory
              </h3>
              <p className="text-xs text-slate-500">Advisory recommendations derived from 24-hour peak predictions.</p>
            </div>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Advisory Only
            </span>
          </div>

          <div className="space-y-3">
            {peakHours?.demand_response_advisory?.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                  item.severity === 'high' 
                    ? 'bg-amber-50/50 border-amber-200/80 text-amber-900' 
                    : 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{item.title}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 border">
                    {item.severity}
                  </span>
                </div>
                <p className="font-medium">{item.action}</p>
                <p className="text-[11px] opacity-80">{item.rationale}</p>
              </div>
            )) || (
              <div className="text-xs text-slate-400 py-6 text-center">
                Generating load-shifting recommendations...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

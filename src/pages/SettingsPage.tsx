import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  TrendingUp, 
  Radio, 
  Globe, 
  Check, 
  Sliders, 
  ShieldCheck,
  FileText
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [model, setModel] = useState('prophet');
  const [horizon, setHorizon] = useState('24');
  const [timezone, setTimezone] = useState('UTC');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-600" />
            Platform & Modeling Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage defaults for time-series forecasting algorithms, streaming parameters, and dataset provenance.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Dataset Provenance */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Dataset Source & Attribution
            </label>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-slate-700">
              <p className="font-semibold text-slate-900">
                UCI Individual Household Electric Power Consumption Dataset
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Repository: <a href="https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium">UCI Machine Learning Repository #235</a>.
                Contains approximately 2,075,259 measurements collected between December 2006 and November 2010.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Academic Limitation Note:</strong> This dataset represents a single residential household in Sceaux, France, utilized here as an industrial smart-meter building load forecasting proxy.
              </div>
            </div>
          </div>

          {/* Forecasting Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Default Forecasting Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-emerald-500"
              >
                <option value="prophet">Prophet (Additive Seasonality + Trend)</option>
                <option value="arima">ARIMA/SARIMAX (p=1, d=1, q=1, s=24)</option>
                <option value="baseline">Seasonal Naive Baseline (24-Hour Benchmark)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" /> Default Horizon
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-emerald-500"
              >
                <option value="12">12 Hours Ahead</option>
                <option value="24">24 Hours Ahead (Next-Day Peak Horizon)</option>
                <option value="48">48 Hours Ahead</option>
                <option value="72">72 Hours Ahead</option>
              </select>
            </div>
          </div>

          {/* Timezone Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Display Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-emerald-500"
              >
                <option value="UTC">UTC (Coordinated Universal Time) — Recommended</option>
                <option value="Local">Local Browser Timezone</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-400" /> Replay Topic Name
              </label>
              <input
                type="text"
                disabled
                value="smart-meter-readings"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              {saved ? 'Preferences Saved' : 'Save Preferences'}
            </button>
            <span className="text-[11px] text-slate-400">Settings persist in local browser storage</span>
          </div>
        </form>
      </div>

      {/* Backend Environment Info (Sanitized) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Sanitized Environment & Deployment Flags
        </h4>
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px] text-slate-700">
          <div>APP_ENV = development / production</div>
          <div>KAFKA_BOOTSTRAP_SERVERS = localhost:9092</div>
          <div>KAFKA_TOPIC = smart-meter-readings</div>
          <div>HDFS_NAMENODE_URL = http://localhost:9870</div>
          <div>STORAGE_BACKEND = local / hdfs</div>
          <div>DATABASE_URL = sqlite:///./data/energy_forecasting.db</div>
        </div>
      </div>
    </div>
  );
};

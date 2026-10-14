import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Database,
  Filter,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import type { ReadingItem, PipelineStatus } from '../types';

export const LiveMeterPage: React.FC = () => {
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [meterId, setMeterId] = useState('household_001');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, meterId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData(false);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, page, pageSize, meterId]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [res, pipe] = await Promise.all([
        api.getReadings({ page, page_size: pageSize, meter_id: meterId || undefined }),
        api.getPipelineStatus(),
      ]);
      setReadings(res.readings);
      setTotalCount(res.total_count);
      setPipelineStatus(pipe);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-amber-950">Streaming Ingestion Source: </span>
            <span>
              UCI Individual Household Power Consumption Dataset replay. Replayed events simulate high-frequency smart-meter intervals for real-time validation.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-amber-300 text-amber-900">
            <span className={`w-1.5 h-1.5 rounded-full ${pipelineStatus?.state === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            Pipeline: {pipelineStatus?.state.toUpperCase() || 'IDLE'}
          </span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Filter Meter:</span>
            <select
              value={meterId}
              onChange={(e) => {
                setMeterId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-emerald-500"
            >
              <option value="household_001">household_001 (Primary UCI Proxy)</option>
              <option value="synthetic_bldg_02">synthetic_bldg_02 (Simulated Commercial)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-Refresh ({autoRefresh ? 'Active' : 'Paused'})
          </button>

          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            title="Manual reload"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Meter ID</th>
                <th className="py-3 px-3">Active Power (kW)</th>
                <th className="py-3 px-3">Reactive (kvar)</th>
                <th className="py-3 px-3">Voltage (V)</th>
                <th className="py-3 px-3">Current (A)</th>
                <th className="py-3 px-3">Submeter 1 (Kitchen Wh)</th>
                <th className="py-3 px-3">Submeter 2 (Laundry Wh)</th>
                <th className="py-3 px-3">Submeter 3 (HVAC/Water Wh)</th>
                <th className="py-3 px-3 text-center">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && readings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading smart-meter readings...
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No readings found for the selected filter.
                  </td>
                </tr>
              ) : (
                readings.map((r, i) => {
                  const isValid = r.is_valid !== false && r.global_active_power_kw !== null;
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {r.timestamp.replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {r.meter_id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-700">
                        {r.global_active_power_kw !== null ? r.global_active_power_kw.toFixed(3) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {r.global_reactive_power_kvar !== null && r.global_reactive_power_kvar !== undefined ? r.global_reactive_power_kvar.toFixed(3) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {r.voltage_v ? r.voltage_v.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {r.global_intensity_a ? r.global_intensity_a.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {r.sub_metering_1_wh ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {r.sub_metering_2_wh ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {r.sub_metering_3_wh ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Missing '?'
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()} total records
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

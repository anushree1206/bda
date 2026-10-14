import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Award, 
  GitBranch, 
  Server, 
  Settings as SettingsIcon,
  Zap,
  Radio,
  HardDrive,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
  activeBackend?: string;
  isStreaming?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  activeBackend = 'Local Storage Fallback',
  isStreaming = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live-meter', label: 'Live Meter Data', icon: Activity },
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
    { id: 'evaluation', label: 'Model Evaluation', icon: Award },
    { id: 'pipeline', label: 'Data Pipeline', icon: GitBranch },
    { id: 'health', label: 'System Health', icon: Server },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-white">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">Energy Forecast</h1>
            <span className="text-[10px] text-slate-500">Smart Building Platform</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Smart Energy</h2>
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <span>Building Load Forecasting</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="px-4 py-3 bg-slate-50/80 mx-3 my-3 rounded-xl border border-slate-200/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <Radio className="w-3.5 h-3.5 text-slate-400" /> Kafka Ingestion
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isStreaming ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isStreaming ? 'Replaying' : 'Idle'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Storage Tier
            </span>
            <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {activeBackend.includes('HDFS') ? 'HDFS Distributed' : 'Local Adapter'}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="p-2.5 rounded-lg bg-slate-100/60 border border-slate-200/60">
            <span className="font-semibold text-slate-700 block">Dataset Attribution:</span>
            <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">
              UCI Household Power Consumption (1-household smart-meter data proxy for building load).
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform</span>
            <span className="text-slate-300">/</span>
            <h2 className="text-sm font-semibold text-slate-900 capitalize">
              {navItems.find((n) => n.id === currentTab)?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              24-Hour Horizon Engine
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-medium">Unit: Active Power (kW)</span>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMeterPage } from './pages/LiveMeterPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { DataPipelinePage } from './pages/DataPipelinePage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [activeBackend, setActiveBackend] = useState<string>('Local Storage Fallback');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  useEffect(() => {
    const checkState = async () => {
      try {
        const [health, pipe] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getPipelineStatus().catch(() => null),
        ]);
        if (health?.active_storage_backend) {
          setActiveBackend(health.active_storage_backend);
        }
        if (pipe?.state === 'running') {
          setIsStreaming(true);
        } else {
          setIsStreaming(false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkState();
    const interval = setInterval(checkState, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeBackend={activeBackend}
      isStreaming={isStreaming}
    >
      {currentTab === 'overview' && <OverviewPage onNavigateTab={setCurrentTab} />}
      {currentTab === 'live-meter' && <LiveMeterPage />}
      {currentTab === 'forecasting' && <ForecastingPage />}
      {currentTab === 'evaluation' && <ModelEvaluationPage />}
      {currentTab === 'pipeline' && <DataPipelinePage />}
      {currentTab === 'health' && <SystemHealthPage />}
      {currentTab === 'settings' && <SettingsPage />}
    </DashboardLayout>
  );
}

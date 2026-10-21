import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

import { DashboardOverview } from './views/DashboardOverview';
import { LiveSensors } from './views/LiveSensors';
import { IrrigationManagement } from './views/IrrigationManagement';
import { HistoryReports } from './views/HistoryReports';
import { AlertsView } from './views/AlertsView';
import { FarmManagement } from './views/FarmManagement';
import { FarmerAssistant } from './views/FarmerAssistant';
import { SettingsView } from './views/SettingsView';

import { Radio, Activity, RefreshCw } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    activeTab,
    liveConnectionStatus,
    totalPacketsReceived,
    lastReceivedTime,
    validatedReading,
    refreshData,
  } = useFarm();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'sensors':
        return <LiveSensors />;
      case 'irrigation':
        return <IrrigationManagement />;
      case 'history':
        return <HistoryReports />;
      case 'alerts':
        return <AlertsView />;
      case 'farm':
        return <FarmManagement />;
      case 'assistant':
        return <FarmerAssistant />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* Real-Time Live Hardware Telemetry Status Ribbon */}
      <div className="bg-emerald-950 text-emerald-200 border-b border-emerald-900/60 text-xs px-4 py-2 transition-colors">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className={`w-2 h-2 rounded-full ${
              liveConnectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">
              Real-Time Hardware Telemetry Stream:
            </span>
            <span className="hidden sm:inline text-emerald-300">
              {liveConnectionStatus === 'connected'
                ? `Active ESP32 Stream • Telemetry verified • Latency: ${validatedReading.stalenessMinutes === 0 ? '<1m' : `${validatedReading.stalenessMinutes}m`}`
                : 'Listening for ESP32 broadcast packets via FastAPI / Local Bridge...'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="hidden md:inline bg-emerald-900/80 px-2.5 py-0.5 rounded border border-emerald-700/60 text-emerald-300">
              Packets: {totalPacketsReceived}
            </span>
            <span className="text-emerald-400">
              {lastReceivedTime
                ? `Last: ${new Date(lastReceivedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Awaiting sync'}
            </span>
            <button
              onClick={() => refreshData()}
              className="p-1 hover:bg-emerald-800 rounded text-emerald-300 hover:text-white transition"
              title="Ping Telemetry Stream"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <FarmProvider>
      <DashboardContent />
    </FarmProvider>
  );
}

export default App;

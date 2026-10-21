import React from 'react';
import { useFarm } from '../context/FarmContext';
import {
  LayoutDashboard,
  Activity,
  Droplets,
  History,
  AlertTriangle,
  MapPin,
  Bot,
  Settings,
  X,
  Radio,
  BatteryCharging
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, t, unreadAlertCount, validatedReading, selectedField } = useFarm();

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
    { id: 'sensors', label: t.nav.liveSensors, icon: Activity },
    { id: 'irrigation', label: t.nav.irrigation, icon: Droplets },
    { id: 'history', label: t.nav.history, icon: History },
    { 
      id: 'alerts', 
      label: t.nav.alerts, 
      icon: AlertTriangle, 
      badge: unreadAlertCount > 0 ? unreadAlertCount : undefined 
    },
    { id: 'farm', label: t.nav.farmCrop, icon: MapPin },
    { id: 'assistant', label: t.nav.assistant, icon: Bot, isHighlighted: true },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-20 h-full md:h-[calc(100vh-4rem)] w-64 bg-emerald-950 text-slate-200 border-r border-emerald-900/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-900 md:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">{t.appName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : item.isHighlighted
                    ? 'text-emerald-300 hover:bg-emerald-900/60 hover:text-white bg-emerald-950/40 border border-emerald-800/40'
                    : 'text-emerald-200/90 hover:bg-emerald-900/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : item.isHighlighted ? 'text-emerald-400' : 'text-emerald-400/80'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Station Status Widget Footer */}
        <div className="p-3 m-3 bg-emerald-900/60 rounded-xl border border-emerald-800/70 text-xs">
          <div className="flex items-center justify-between mb-1 text-emerald-200">
            <span className="flex items-center space-x-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="truncate max-w-[120px]">{selectedField?.assignedStationId}</span>
            </span>
            <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
              v1.4
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-300/80">
            <span className="flex items-center space-x-1">
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              <span>{validatedReading?.battery ?? 90}%</span>
            </span>
            <span className="truncate text-emerald-400 font-medium">
              {selectedField?.name.split('—')[0] || 'Zone 1'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

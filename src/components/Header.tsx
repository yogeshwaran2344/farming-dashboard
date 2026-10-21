import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Sprout,
  Bell,
  Wifi,
  WifiOff,
  Languages,
  Menu,
  Clock,
  Layers,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    t,
    language,
    setLanguage,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    unreadAlertCount,
    setActiveTab,
    validatedReading,
    liveConnectionStatus,
  } = useFarm();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'kn' ? 'kn-IN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const isFresh = validatedReading.status === 'fresh';
  const isStale = validatedReading.status === 'stale';
  const isFault = validatedReading.status === 'invalid';

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: mobile hamburger & brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              className="flex items-center space-x-2.5 cursor-pointer"
              onClick={() => setActiveTab('overview')}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner text-white">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">{t.appName}</span>
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded-full border border-emerald-600/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Live</span>
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 hidden lg:block leading-none">
                  {t.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Field Selector & Live Stream Pill */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-700/60">
              <Layers className="w-4 h-4 text-emerald-400" />
              <label htmlFor="field-select" className="text-xs text-emerald-200 font-medium">
                {t.header.fieldSelect}:
              </label>
              <select
                id="field-select"
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="bg-emerald-900 text-white text-xs font-semibold rounded px-2 py-1 border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id} className="bg-emerald-950 text-white">
                    {f.name} ({f.cropType})
                  </option>
                ))}
              </select>
            </div>

            {/* Real-time Hardware Stream Badge */}
            <div className="flex items-center space-x-1.5 bg-emerald-950/90 text-emerald-200 text-xs px-3 py-1.5 rounded-lg border border-emerald-700/60 font-semibold">
              <Radio className={`w-3.5 h-3.5 ${liveConnectionStatus === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{liveConnectionStatus === 'connected' ? 'ESP32 Streaming' : 'ESP32 Listening'}</span>
            </div>
          </div>

          {/* Right section: Live Time, Sensor State, Language, Alerts */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Clock */}
            <div className="hidden xl:flex flex-col items-end text-right text-emerald-100 border-r border-emerald-700/60 pr-3">
              <div className="flex items-center text-xs font-semibold space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTime(currentTime)}</span>
              </div>
              <span className="text-[11px] text-emerald-300">{formatDate(currentTime)}</span>
            </div>

            {/* Central Sensor Health & Freshness Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isFresh
                  ? 'bg-emerald-800/90 text-emerald-200 border-emerald-500/50'
                  : isStale
                  ? 'bg-amber-900/80 text-amber-200 border-amber-600/50 animate-pulse'
                  : isFault
                  ? 'bg-rose-900/80 text-rose-200 border-rose-600/50'
                  : 'bg-slate-800/80 text-slate-300 border-slate-600/50'
              }`}
              title={
                isFresh
                  ? "Real-time telemetry is fresh and verified"
                  : isStale
                  ? `Stale data received ${validatedReading.stalenessMinutes}m ago. Automated advice locked.`
                  : "Sensor error or disconnected"
              }
            >
              {isFresh ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px]">Fresh Telemetry</span>
                </>
              ) : isStale ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Stale ({validatedReading.stalenessMinutes}m)</span>
                </>
              ) : isFault ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[11px]">Sensor Fault</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">No Telemetry</span>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold transition-all"
              title="Switch Language / ಭಾಷೆ ಬದಲಿಸಿ"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-300" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 transition-all"
              aria-label="View Alerts"
            >
              <Bell className="w-4 h-4 text-emerald-100" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

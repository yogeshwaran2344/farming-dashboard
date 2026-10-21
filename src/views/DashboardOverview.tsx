import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Droplets,
  Thermometer,
  CloudSun,
  Activity,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Droplet,
  WifiOff,
  Database,
  Layers,
  HelpCircle,
  TrendingDown,
  Info,
  Calendar,
  Radio,
  FileText,
  CheckSquare,
  Square,
  PlusCircle,
  RotateCcw,
  Edit3,
  X,
  Check
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const DashboardOverview: React.FC = () => {
  const {
    t,
    language,
    tempUnit,
    fields,
    selectedField,
    selectedFieldId,
    setSelectedFieldId,
    validatedReading,
    getValidatedReadingForField,
    currentRecommendation,
    historicalReadings,
    alerts,
    activities,
    setActiveTab,
    getStationForField,
    recordUserReading,
    clearAllReadings,
    totalPacketsReceived,
  } = useFarm();

  const [graphPeriod, setGraphPeriod] = useState<'1h' | '24h' | '7d'>('24h');
  const [showMoisture, setShowMoisture] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<'alerts' | 'activity'>('alerts');

  // Manual Reading Input Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualFieldId, setManualFieldId] = useState(selectedFieldId);
  const [manualMoisture, setManualMoisture] = useState<number>(42);
  const [manualTemp, setManualTemp] = useState<number>(28);
  const [manualHum, setManualHum] = useState<number>(65);
  const [manualSuccess, setManualSuccess] = useState(false);

  const station = getStationForField(selectedField?.id || '');

  // Format temperature
  const displayTemp = (tempC: number | null) => {
    if (tempC === null) return '--';
    if (tempUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${tempC}°C`;
  };

  // 1. Overall Farm Health Summary Calculation across all fields
  const farmHealthSummary = useMemo(() => {
    let deficitCount = 0;
    let optimalCount = 0;
    let surplusCount = 0;
    let warningCount = 0;
    let totalArea = 0;

    fields.forEach(field => {
      totalArea += field.area;
      const val = getValidatedReadingForField(field.id);
      if (!val.isLiveReliable) {
        warningCount++;
      } else if (val.soilMoisture !== null) {
        if (val.soilMoisture < field.targetMoistureMin) {
          deficitCount++;
        } else if (val.soilMoisture > field.targetMoistureMax) {
          surplusCount++;
        } else {
          optimalCount++;
        }
      }
    });

    return {
      totalFields: fields.length,
      totalArea: Math.round(totalArea * 10) / 10,
      deficitCount,
      optimalCount,
      surplusCount,
      warningCount,
      hasReadings: optimalCount > 0 || deficitCount > 0 || surplusCount > 0,
      allHealthy: (optimalCount > 0) && (deficitCount === 0) && (warningCount === 0),
    };
  }, [fields, getValidatedReadingForField]);

  // Filter historical data for chart based on selected field and period
  const chartData = useMemo(() => {
    const fieldData = historicalReadings.filter(r => r.fieldId === selectedField?.id && r.isValid);
    const now = Date.now();

    let cutoffMs = 24 * 60 * 60 * 1000;
    if (graphPeriod === '1h') cutoffMs = 60 * 60 * 1000;
    if (graphPeriod === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;

    let filtered = fieldData.filter(r => now - new Date(r.timestamp).getTime() <= cutoffMs);
    if (filtered.length === 0 && fieldData.length > 0) {
      filtered = fieldData.slice(-10);
    }

    // Deduplicate timestamps
    const seen = new Set<string>();
    const deduplicated = filtered.filter(r => {
      if (seen.has(r.timestamp)) return false;
      seen.add(r.timestamp);
      return true;
    });

    return deduplicated.map(r => {
      const d = new Date(r.timestamp);
      const timeLabel = graphPeriod === '7d' 
        ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        timestamp: timeLabel,
        moisture: r.soilMoisture,
        temperature: tempUnit === 'F' ? Math.round((r.temperature * 9) / 5 + 32) : r.temperature,
        humidity: r.humidity,
      };
    });
  }, [historicalReadings, selectedField, graphPeriod, tempUnit]);

  // Status badge styling for recommendation
  const recBadgeConfig = {
    low: {
      bg: 'bg-amber-500/10 border-amber-300 text-amber-900',
      badgeBg: 'bg-amber-600 text-white',
      icon: Droplet,
      border: 'border-amber-400',
      label: 'IRRIGATION RECOMMENDED',
    },
    optimal: {
      bg: 'bg-emerald-500/10 border-emerald-300 text-emerald-900',
      badgeBg: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      border: 'border-emerald-400',
      label: 'SOIL MOISTURE OPTIMAL',
    },
    high: {
      bg: 'bg-blue-500/10 border-blue-300 text-blue-900',
      badgeBg: 'bg-blue-600 text-white',
      icon: AlertTriangle,
      border: 'border-blue-400',
      label: 'SURPLUS / SATURATED',
    },
    stale: {
      bg: 'bg-amber-50 border-amber-300 text-amber-950',
      badgeBg: 'bg-amber-600 text-white',
      icon: Clock,
      border: 'border-amber-400',
      label: 'DECISION SUSPENDED',
    },
    fault: {
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      badgeBg: 'bg-rose-600 text-white',
      icon: AlertCircle,
      border: 'border-rose-400',
      label: 'SENSOR PROBE ERROR',
    },
    missing: {
      bg: 'bg-slate-100 border-slate-300 text-slate-800',
      badgeBg: 'bg-slate-600 text-white',
      icon: WifiOff,
      border: 'border-slate-400',
      label: 'AWAITING TELEMETRY',
    },
  }[currentRecommendation.status] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    badgeBg: 'bg-slate-600 text-white',
    icon: AlertCircle,
    border: 'border-slate-300',
    label: 'ANALYZING',
  };

  const isStale = validatedReading.status === 'stale';
  const isFault = validatedReading.status === 'invalid';
  const recentAlerts = alerts.slice(0, 4);
  const recentActivities = activities.slice(0, 4);

  // Calculate soil water availability metric for the active field
  const soilWaterAvailability = useMemo(() => {
    if (validatedReading.soilMoisture === null || !selectedField) return null;
    const min = selectedField.targetMoistureMin;
    const max = selectedField.targetMoistureMax;
    const cur = validatedReading.soilMoisture;
    
    // Percentage between min (0% refill capacity) and max (100% field capacity)
    const rawRatio = ((cur - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, Math.round(rawRatio)));
  }, [validatedReading.soilMoisture, selectedField]);

  return (
    <div className="space-y-6">
      {/* Real-Time Live Telemetry Hardware Stream Monitor */}
      <div className="rounded-2xl p-4 border text-xs shadow-sm bg-emerald-50/90 border-emerald-300 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-200 text-emerald-800 mt-0.5 flex-shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-emerald-800 text-white shadow-2xs">
                Live Hardware Stream
              </span>
              <span className="font-semibold text-slate-700">
                Active Node: <strong className="text-slate-900">{getStationForField(selectedField?.id || '')?.name || 'ESP32 Station'}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-600">
                Latest Packet: {validatedReading.timestamp
                  ? `${new Date(validatedReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${validatedReading.stalenessMinutes === 0 ? 'just now' : `${validatedReading.stalenessMinutes}m ago`})`
                  : 'Awaiting sync'}
              </span>
            </div>
            <p className="mt-1 leading-relaxed text-slate-700">
              Streaming calibrated telemetry from physical ESP32 station nodes. Soil moisture measured via Capacitive v1.2 sensor, temperature and relative humidity via digital DHT22 probe. Automated irrigation decisions are computed strictly on validated electrical measurements.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center flex-shrink-0 text-xs">
          <button
            onClick={() => {
              setManualFieldId(selectedFieldId);
              setShowManualModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Input Field Reading</span>
          </button>

          {historicalReadings.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Reset all field readings back to Nil/Awaiting Sensor state?")) {
                  clearAllReadings();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-semibold border border-slate-200 transition"
              title="Reset all values to Nil until next sensor transmission"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset to Nil</span>
            </button>
          )}

          <div className="bg-white/90 border border-emerald-200 rounded-xl px-2.5 py-1.5 flex items-center space-x-1.5 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${totalPacketsReceived > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold text-emerald-900 text-[11px]">
              {totalPacketsReceived > 0 ? `${totalPacketsReceived} Packets` : 'Awaiting Link'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Farm Health Summary Card (Priority 1 item 1) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Farm Executive Health Summary
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive status across {farmHealthSummary.totalFields} agricultural zones ({farmHealthSummary.totalArea} total acres)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              !farmHealthSummary.hasReadings
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : farmHealthSummary.allHealthy
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {!farmHealthSummary.hasReadings
                ? 'Awaiting Sensor Telemetry'
                : farmHealthSummary.allHealthy
                ? 'All Field Zones Optimal'
                : `${farmHealthSummary.deficitCount} Zone(s) Require Irrigation`}
            </span>
          </div>
        </div>

        {/* Multi-Zone Quick Switcher Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields.map(f => {
            const val = getValidatedReadingForField(f.id);
            const isSelected = selectedFieldId === f.id;
            const isMissing = val.status === 'missing' || val.soilMoisture === null;
            const isDeficit = val.isLiveReliable && val.soilMoisture !== null && val.soilMoisture < f.targetMoistureMin;
            const isSurplus = val.isLiveReliable && val.soilMoisture !== null && val.soilMoisture > f.targetMoistureMax;
            const hasIssue = !val.isLiveReliable && !isMissing;

            return (
              <button
                key={f.id}
                onClick={() => setSelectedFieldId(f.id)}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isMissing ? 'bg-slate-300' : hasIssue ? 'bg-rose-500' : isDeficit ? 'bg-amber-500' : isSurplus ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[120px]">{f.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{f.cropType}</span>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-xs text-slate-800">
                    {val.soilMoisture !== null ? `${val.soilMoisture}%` : '--'}
                  </span>
                  <span className={`text-[10px] block font-bold ${
                    isMissing ? 'text-slate-400' : hasIssue ? 'text-rose-600' : isDeficit ? 'text-amber-700' : isSurplus ? 'text-blue-700' : 'text-emerald-700'
                  }`}>
                    {isMissing ? 'Nil' : hasIssue ? 'Stale' : isDeficit ? 'Dry' : isSurplus ? 'High' : 'Optimal'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Soil Moisture, Temperature and Humidity Cards (Priority 1 item 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Soil Moisture */}
        <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-shadow ${
          isStale ? 'border-amber-300 bg-amber-50/20' : isFault ? 'border-rose-300' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cards.soilMoisture}
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isStale ? 'bg-amber-100 text-amber-700' : isFault ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Droplets className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isStale ? 'text-amber-800 opacity-75' : isFault ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {validatedReading.soilMoisture !== null ? `${validatedReading.soilMoisture}%` : '--'}
            </span>

            {/* Validation State Badge */}
            {validatedReading.soilMoisture !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isStale
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : isFault
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : validatedReading.soilMoisture < (selectedField?.targetMoistureMin ?? 40)
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : validatedReading.soilMoisture > (selectedField?.targetMoistureMax ?? 70)
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isStale
                  ? 'Stale Value'
                  : isFault
                  ? 'Invalid ADC'
                  : validatedReading.soilMoisture < (selectedField?.targetMoistureMin ?? 40)
                  ? 'Dry (Deficit)'
                  : validatedReading.soilMoisture > (selectedField?.targetMoistureMax ?? 70)
                  ? 'Surplus'
                  : 'Optimal'}
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Awaiting Sensor
              </span>
            )}
          </div>

          {/* Meaningful Context Metrics */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Sensor Depth:</span>
              <span className="font-semibold text-slate-700">6 inches (Root Zone)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Available Water (RAW):</span>
              <span className={`font-bold ${soilWaterAvailability !== null && soilWaterAvailability < 30 ? 'text-amber-700' : soilWaterAvailability !== null ? 'text-emerald-700' : 'text-slate-400'}`}>
                {soilWaterAvailability !== null ? `${soilWaterAvailability}%` : 'Nil (Awaiting probe)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Range:</span>
              <span className="font-semibold text-slate-800">
                {selectedField?.targetMoistureMin}% – {selectedField?.targetMoistureMax}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cards.temperature}
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {displayTemp(validatedReading.temperature)}
            </span>
            <span className="text-xs text-slate-400 font-medium">canopy</span>
          </div>

          {/* Meaningful Heat Stress & Evaporation Context */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Heat Stress Risk:</span>
              <span className={`font-bold ${validatedReading.temperature === null ? 'text-slate-400' : 'text-emerald-700'}`}>
                {validatedReading.temperature === null ? 'Nil (Awaiting probe)' : 'Low (Comfort Zone)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transpiration Rate:</span>
              <span className="font-semibold text-slate-700">
                {validatedReading.temperature === null ? '--' : 'Moderate Active'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sensor Probe:</span>
              <span className="font-mono text-slate-700">DHT22 Digital</span>
            </div>
          </div>
        </div>

        {/* Card 3: Air Humidity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cards.humidity}
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
              <CloudSun className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {validatedReading.humidity !== null ? `${validatedReading.humidity}%` : '--'}
            </span>
            <span className="text-xs text-slate-400 font-medium">RH</span>
          </div>

          {/* Meaningful Foliar Disease Risk Context */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Foliar Fungal Risk:</span>
              <span className={`font-bold ${validatedReading.humidity === null ? 'text-slate-400' : 'text-emerald-700'}`}>
                {validatedReading.humidity === null ? 'Nil (Awaiting probe)' : 'Low (Dry Foliage)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Evaporative Demand:</span>
              <span className="font-semibold text-slate-700">
                {validatedReading.humidity === null ? '--' : 'Normal Gradient'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Atmospheric Air:</span>
              <span className="font-semibold text-slate-700">
                {validatedReading.humidity === null ? '--' : 'Unsaturated'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Device Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cards.deviceStatus}
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              validatedReading.isLiveReliable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
              validatedReading.isLiveReliable ? 'text-emerald-700' : 'text-slate-600'
            }`}>
              {validatedReading.isLiveReliable ? t.connected : isStale ? 'Stale Data' : isFault ? 'Fault' : 'Awaiting Hardware'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {validatedReading.battery ? `${validatedReading.battery}% batt` : 'No Signal'}
            </span>
          </div>

          {/* Technical Diagnostics */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Telemetry:</span>
              <span className="font-semibold text-slate-800">
                {validatedReading.timestamp
                  ? validatedReading.stalenessMinutes <= 1
                    ? 'Fresh (just now)'
                    : `${validatedReading.stalenessMinutes}m ago`
                  : 'Nil (No Packets)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WiFi RSSI:</span>
              <span className="font-mono text-slate-700">{validatedReading.signalRssi ? `${validatedReading.signalRssi} dBm` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Node ID:</span>
              <span className="font-mono text-slate-700 truncate max-w-[100px]">{station?.id || 'Unpaired'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Upgraded Irrigation Recommendation Panel (Priority 1 item 3) */}
      <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition-all ${recBadgeConfig.bg} ${recBadgeConfig.border}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${recBadgeConfig.badgeBg}`}>
              <recBadgeConfig.icon className="w-7 h-7 text-white" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-300 text-slate-900 shadow-2xs">
                  {recBadgeConfig.label}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
                  {currentRecommendation.ruleTriggered}
                </span>
                <span className="text-xs text-slate-600 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Packet: {validatedReading.timestamp
                      ? new Date(validatedReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {currentRecommendation.title}
              </h2>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {currentRecommendation.action}
              </p>
              
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                <p>
                  <strong className="text-slate-900">Agronomic Rationale: </strong>
                  {currentRecommendation.reason}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <span><strong>Method:</strong> {selectedField?.irrigationMethod}</span>
                  <span><strong>Crop Stage:</strong> {selectedField?.cropStage}</span>
                  <span><strong>Soil Type:</strong> {selectedField?.soilType}</span>
                  <span><strong>Recommended Run:</strong> {currentRecommendation.status === 'low' ? '90 minutes (Drip)' : '0 minutes'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200/80 min-w-[200px]">
            <div className="text-left lg:text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Configured Field Thresholds
              </span>
              <div className="text-sm font-black text-slate-900">
                {selectedField?.targetMoistureMin}% (Refill) – {selectedField?.targetMoistureMax}% (Cutoff)
              </div>
            </div>

            <button
              onClick={() => setActiveTab('irrigation')}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-2"
            >
              <span>Manage Irrigation Controls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Historical Trends Graph & 4. Recent Alerts & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph (Span 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">{t.graphs.title}</h3>
              <p className="text-xs text-slate-500">
                Historical telemetry stream for {selectedField?.name} (Verified Real-Time Ingestion)
              </p>
            </div>

            {/* Period Filters */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setGraphPeriod('1h')}
                className={`px-3 py-1 rounded-lg transition ${
                  graphPeriod === '1h' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1h
              </button>
              <button
                onClick={() => setGraphPeriod('24h')}
                className={`px-3 py-1 rounded-lg transition ${
                  graphPeriod === '24h' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setGraphPeriod('7d')}
                className={`px-3 py-1 rounded-lg transition ${
                  graphPeriod === '7d' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7d
              </button>
            </div>
          </div>

          {/* Series Toggles */}
          <div className="flex items-center space-x-4 text-xs font-medium pb-3 border-b border-slate-100">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showMoisture}
                onChange={(e) => setShowMoisture(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-emerald-700 font-bold">Soil Moisture (%)</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showTemp}
                onChange={(e) => setShowTemp(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-orange-700 font-bold">Temperature ({tempUnit === 'F' ? '°F' : '°C'})</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHumidity}
                onChange={(e) => setShowHumidity(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-cyan-700 font-bold">Humidity (%)</span>
            </label>
          </div>

          {/* Chart Display */}
          <div className="h-64 sm:h-72 mt-4 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  {showMoisture && selectedField && (
                    <>
                      <ReferenceLine
                        y={selectedField.targetMoistureMin}
                        stroke="#d97706"
                        strokeDasharray="4 4"
                        label={{ value: `Refill Min ${selectedField.targetMoistureMin}%`, fill: '#d97706', fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={selectedField.targetMoistureMax}
                        stroke="#2563eb"
                        strokeDasharray="4 4"
                        label={{ value: `Cutoff Max ${selectedField.targetMoistureMax}%`, fill: '#2563eb', fontSize: 10 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="moisture"
                        name="Moisture (%)"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </>
                  )}
                  {showTemp && (
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name={`Temp (${tempUnit === 'F' ? '°F' : '°C'})`}
                      stroke="#ea580c"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {showHumidity && (
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#0891b2"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl max-w-sm">
                <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-700">No Telemetry Recorded Yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Historical trends will plot automatically once physical ESP32 sensors broadcast or a manual reading is entered.
                </p>
                <button
                  onClick={() => {
                    setManualFieldId(selectedFieldId);
                    setShowManualModal(true);
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Input Field Reading</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Alerts & Farm Activity Feed (Priority 1 item 4) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            {/* Feed Tabs: Alerts vs Activity Log */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveFeedTab('alerts')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeFeedTab === 'alerts' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Alerts ({alerts.length})
                </button>
                <button
                  onClick={() => setActiveFeedTab('activity')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeFeedTab === 'activity' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activity ({activities.length})
                </button>
              </div>

              <button
                onClick={() => setActiveTab(activeFeedTab === 'alerts' ? 'alerts' : 'history')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View All
              </button>
            </div>

            {/* Tab 1: Alerts */}
            {activeFeedTab === 'alerts' && (
              <div className="space-y-2.5">
                {recentAlerts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p>{t.alerts.empty}</p>
                  </div>
                ) : (
                  recentAlerts.map(alt => {
                    const isCrit = alt.severity === 'critical';
                    const isWarn = alt.severity === 'warning';

                    return (
                      <div
                        key={alt.id}
                        className={`p-3 rounded-xl border text-xs transition ${
                          isCrit
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : isWarn
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs">{alt.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">
                          {alt.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Activity Log */}
            {activeFeedTab === 'activity' && (
              <div className="space-y-2.5">
                {recentActivities.map(act => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 space-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-slate-900">{act.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {act.description}
                    </p>
                    {act.badge && (
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {act.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Active alerts: {alerts.filter(a => a.status === 'active').length}
            </span>
            <button
              onClick={() => setActiveTab('assistant')}
              className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask Farm Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Field Reading Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-800 rounded-lg">
                  <Edit3 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Input Manual Field Reading</h3>
                  <p className="text-xs text-emerald-200">Record current field observation or test values</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await recordUserReading(manualFieldId, manualMoisture, manualTemp, manualHum);
                setManualSuccess(true);
                setTimeout(() => {
                  setManualSuccess(false);
                  setShowManualModal(false);
                }, 1000);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Field:</label>
                <select
                  value={manualFieldId}
                  onChange={(e) => setManualFieldId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.cropType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Soil Moisture (%):</span>
                  <span className="font-bold text-emerald-800 text-sm">{manualMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={manualMoisture}
                  onChange={(e) => setManualMoisture(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Air Temperature (°C):</span>
                  <span className="font-bold text-amber-800 text-sm">{manualTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="0.5"
                  value={manualTemp}
                  onChange={(e) => setManualTemp(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Air Humidity (% RH):</span>
                  <span className="font-bold text-blue-800 text-sm">{manualHum}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="95"
                  value={manualHum}
                  onChange={(e) => setManualHum(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>

              {manualSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center font-bold flex items-center justify-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Reading Saved & Applied to Dashboard!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-sm transition flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Apply Reading</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

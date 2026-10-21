import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Droplets,
  Power,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Clock,
  ShieldAlert,
  Flame,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const IrrigationManagement: React.FC = () => {
  const {
    t,
    language,
    selectedField,
    updateField,
    validatedReading,
    currentRecommendation,
    pumpState,
    startPump,
    stopPump,
    emergencyStopPump,
    dataSourceMode,
  } = useFarm();

  const [minThreshold, setMinThreshold] = useState<number>(selectedField?.targetMoistureMin ?? 40);
  const [maxThreshold, setMaxThreshold] = useState<number>(selectedField?.targetMoistureMax ?? 70);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sync state if selected field changes
  React.useEffect(() => {
    if (selectedField) {
      setMinThreshold(selectedField.targetMoistureMin);
      setMaxThreshold(selectedField.targetMoistureMax);
    }
  }, [selectedField]);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;

    if (minThreshold >= maxThreshold) {
      alert("Lower threshold must be less than upper threshold!");
      return;
    }

    updateField({
      ...selectedField,
      targetMoistureMin: Number(minThreshold),
      targetMoistureMax: Number(maxThreshold),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const moisture = validatedReading.soilMoisture;
  const isStale = validatedReading.status === 'stale';
  const isOptimal = moisture !== null && moisture >= minThreshold && moisture <= maxThreshold;
  const isLow = moisture !== null && moisture < minThreshold;
  const isHigh = moisture !== null && moisture > maxThreshold;

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t.irrigation.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t.irrigation.subtitle}
        </p>
      </div>

      {/* 4.1 Soil Moisture Status Visualizer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.irrigation.statusLabel}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {selectedField?.name} ({selectedField?.cropType})
            </h2>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            moisture === null
              ? 'bg-slate-100 text-slate-600 border-slate-300'
              : isLow
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : isHigh
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {moisture === null
              ? (language === 'kn' ? 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ' : 'Awaiting Sensor Telemetry')
              : isLow
              ? t.irrigation.lowState
              : isHigh
              ? t.irrigation.highState
              : t.irrigation.optimalState}
          </span>
        </div>

        {/* Visual Progress / Target Gauge Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>0% (Dry Soil)</span>
            <span className="text-amber-700">Trigger Min: {minThreshold}%</span>
            <span className="text-emerald-700 font-extrabold text-sm">
              Current: {moisture !== null ? `${moisture}%` : '--'}
            </span>
            <span className="text-blue-700">Upper Stop: {maxThreshold}%</span>
            <span>100% (Saturation)</span>
          </div>

          <div className="h-5 w-full bg-slate-100 rounded-full relative overflow-hidden border border-slate-200">
            {/* Safe zone highlight */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-100/90 border-l border-r border-emerald-400"
              style={{
                left: `${minThreshold}%`,
                width: `${maxThreshold - minThreshold}%`,
              }}
            />

            {/* Current Moisture Needle Bar */}
            {moisture !== null && (
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isLow ? 'bg-amber-500' : isHigh ? 'bg-blue-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, moisture))}%` }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Current Reading:</span>
            <p className="font-extrabold text-slate-900 text-base mt-0.5">
              {moisture !== null ? `${moisture}%` : '--'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Target Range:</span>
            <p className="font-extrabold text-emerald-800 text-base mt-0.5">
              {minThreshold}% – {maxThreshold}%
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Evaluation:</span>
            <p className="font-extrabold text-slate-800 text-base mt-0.5">
              {currentRecommendation.title}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 4.2 Threshold Configuration & 4.4 Pump Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4.2 Crop-specific Threshold Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {t.irrigation.thresholdConfig}
            </h2>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.irrigation.minThreshold}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <span className="w-14 text-center font-bold text-sm bg-slate-100 py-1 px-2 rounded-lg border border-slate-200">
                  {minThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                When soil moisture dips below this value, the dashboard triggers an irrigation recommendation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.irrigation.maxThreshold}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="55"
                  max="95"
                  value={maxThreshold}
                  onChange={(e) => setMaxThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <span className="w-14 text-center font-bold text-sm bg-slate-100 py-1 px-2 rounded-lg border border-slate-200">
                  {maxThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upper limit indicating field moisture capacity. Above this, watering should cease immediately.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Rule applies to: <strong>{selectedField?.cropType}</strong>
              </span>

              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>{t.irrigation.saveThresholds}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 4.4 Pump Controller */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Power className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">
                  {t.irrigation.pumpControlTitle}
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                Hardware Bridge Ready
              </span>
            </div>

            {/* Current pump status state card */}
            <div className={`p-4 rounded-xl border transition-all ${
              pumpState.status === 'ON'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    pumpState.status === 'ON' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span className="font-bold text-sm">
                    {pumpState.status === 'ON' ? t.irrigation.pumpOn : t.irrigation.pumpOff}
                  </span>
                </div>

                {pumpState.status === 'ON' && (
                  <div className="flex items-center space-x-1 text-xs font-mono font-bold text-emerald-800">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatSeconds(pumpState.activeRemainingSeconds)} left</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {t.irrigation.pumpWarning}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <div className="flex items-center space-x-3">
              {pumpState.status === 'OFF' ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <Power className="w-4 h-4" />
                  <span>{t.irrigation.turnOn}</span>
                </button>
              ) : (
                <button
                  onClick={() => stopPump()}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <Power className="w-4 h-4" />
                  <span>{t.irrigation.turnOff}</span>
                </button>
              )}

              <button
                onClick={() => emergencyStopPump()}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                title="Immediate safety cut-out"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t.irrigation.emergencyStop}</span>
              </button>
            </div>

            {pumpState.isEmergencyStopped && (
              <p className="text-xs font-bold text-rose-600 text-center animate-pulse">
                Emergency stop lock is engaged. Reset in field prior to restart.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4.3 Irrigation Recommendation Explanations Matrix */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-900 mb-3">
          Rule-Based Irrigation Guidance Matrix (Deterministic Logic)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">System Evaluation</th>
                <th className="py-2.5 px-3">Farmer Action Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Reading Missing / Stale &gt; 30m</td>
                <td className="py-2.5 px-3 text-amber-700">Telemetry Timeout</td>
                <td className="py-2.5 px-3">Raise sensor warning; halt automatic moisture recommendations.</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Moisture &lt; Lower Threshold</td>
                <td className="py-2.5 px-3 text-amber-700">Soil Deficit Detected</td>
                <td className="py-2.5 px-3">Recommend checking soil and irrigating if appropriate.</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Moisture in Range [Min, Max]</td>
                <td className="py-2.5 px-3 text-emerald-700">Optimal Root Hydration</td>
                <td className="py-2.5 px-3">Show moisture is healthy; no additional water required.</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Moisture &gt; Upper Threshold</td>
                <td className="py-2.5 px-3 text-blue-700">Moisture Surplus / Saturation</td>
                <td className="py-2.5 px-3">Warn that additional irrigation risks root asphyxiation / fungus.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Confirmation Modal for Pump Start */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-800">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Power className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Confirm Pump Start Command
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.irrigation.confirmStart} The system will arm the 30-minute auto-cutoff safety protection. Ensure all valves in <strong>{selectedField?.name}</strong> are open before powering on.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startPump();
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
              >
                Yes, Start Pump
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

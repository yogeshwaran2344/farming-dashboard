import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Activity,
  Radio,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  RefreshCw,
  Cpu,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const LiveSensors: React.FC = () => {
  const {
    t,
    language,
    tempUnit,
    stations,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    historicalReadings,
    getValidatedReadingForField,
    refreshData,
    isAutoRefreshing,
    setIsAutoRefreshing,
    transmitTelemetry,
    liveConnectionStatus,
    totalPacketsReceived,
    lastReceivedTime,
  } = useFarm();

  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || '');

  // Bench transmitter form state for manual / hardware broadcast
  const [txMoisture, setTxMoisture] = useState<number>(45);
  const [txTemp, setTxTemp] = useState<number>(28.5);
  const [txHumidity, setTxHumidity] = useState<number>(65);
  const [txBattery, setTxBattery] = useState<number>(92);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [txSuccessMessage, setTxSuccessMessage] = useState<string | null>(null);

  const displayTemp = (tempC: number | null) => {
    if (tempC === null) return '--';
    if (tempUnit === 'F') return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    return `${tempC}°C`;
  };

  // Currently inspected station
  const activeStation = stations.find(s => s.id === selectedStationId) || stations[0];
  const activeField = fields.find(f => f.assignedStationId === activeStation?.id) || fields[0];
  const activeReading = getValidatedReadingForField(activeField?.id || '');

  // Calculate age of reading
  const readingAgeMinutes = activeReading.timestamp !== null ? activeReading.stalenessMinutes : null;

  // Station readings for mini chart (deduplicated)
  const stationGraphData = React.useMemo(() => {
    const raw = historicalReadings
      .filter(r => r.stationId === activeStation?.id && r.isValid);
    
    const seen = new Set<string>();
    const deduplicated = raw.filter(r => {
      if (seen.has(r.timestamp)) return false;
      seen.add(r.timestamp);
      return true;
    });

    return deduplicated.slice(-24).map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      moisture: r.soilMoisture,
      temperature: tempUnit === 'F' ? Math.round((r.temperature * 9) / 5 + 32) : r.temperature,
    }));
  }, [historicalReadings, activeStation?.id, tempUnit]);

  // Handle immediate telemetry transmission
  const handleSendPacket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    try {
      await transmitTelemetry({
        stationId: activeStation.id,
        fieldId: activeField.id,
        soilMoisture: Number(txMoisture),
        temperature: Number(txTemp),
        humidity: Number(txHumidity),
        battery: Number(txBattery),
        signalRssi: -64,
      });
      setTxSuccessMessage(`Transmitted packet to ${activeStation.name}! Dashboard updated in real time.`);
      setTimeout(() => setTxSuccessMessage(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Recent 6 live packets across all stations
  const recentPackets = React.useMemo(() => {
    return [...historicalReadings].slice(-6).reverse();
  }, [historicalReadings]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.sensors.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Hardware Link</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.sensors.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refreshData()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.sensors.refresh}</span>
          </button>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition">
            <input
              type="checkbox"
              checked={isAutoRefreshing}
              onChange={(e) => setIsAutoRefreshing(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t.sensors.autoRefresh}</span>
          </label>
        </div>
      </div>

      {/* Connectivity Integrity Disclaimer Alert */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-950 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-emerald-900">Real-Time Sensor Telemetry Protocol: </strong>
          Readings reflect verified time-stamped telemetry packets received from ESP32 station nodes. If an ESP32 loses battery or WiFi signal beyond 30 minutes, it is automatically marked <em>Offline/Stale</em> and its automated advice is quarantined.
        </div>
      </div>

      {/* Sensor Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stations.map((st) => {
          const field = fields.find(f => f.assignedStationId === st.id);
          const validated = field ? getValidatedReadingForField(field.id) : undefined;
          const isSelected = activeStation?.id === st.id;

          const isOnline = validated?.isLiveReliable ?? false;
          const isStale = validated?.status === 'stale';
          const isFault = validated?.status === 'invalid';

          return (
            <div
              key={st.id}
              onClick={() => {
                setSelectedStationId(st.id);
                if (field) setSelectedFieldId(field.id);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isFault ? 'bg-rose-500' : isStale ? 'bg-amber-500' : isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  <h3 className="font-bold text-sm text-slate-900">{st.name}</h3>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isFault
                    ? 'bg-rose-100 text-rose-800'
                    : isStale
                    ? 'bg-amber-100 text-amber-800'
                    : isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {isFault ? 'Probe Fault' : isStale ? `Stale (${validated?.stalenessMinutes}m)` : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Assigned Field:</span>
                  <span className="font-semibold text-slate-700">{field?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware Model:</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                    {st.hardwareModel.split('+')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Signal RSSI:</span>
                  <span className="font-mono text-slate-700">{validated?.signalRssi ?? -65} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span>Battery State:</span>
                  <span className="font-semibold text-emerald-700">{st.battery}% Li-ion</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {validated?.timestamp
                    ? `Updated ${new Date(validated.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'No telemetry'}
                </span>
                <span className="text-emerald-700 font-bold hover:underline text-xs">
                  {isSelected ? 'Viewing Diagnostics' : 'Inspect'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Selected Station Telemetry & Live Hardware Transmitter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detailed Diagnostics & Graph (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-slate-900">{activeStation.name} — Technical Telemetry</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deployed in {activeField.name} ({activeField.cropType}) • IP: {activeStation.ipAddress || '192.168.1.140'}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono">
                Firmware: {activeStation.firmware}
              </span>
            </div>
          </div>

          {/* Live Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Calibrated Soil Moisture</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {activeReading.soilMoisture !== null ? `${activeReading.soilMoisture}%` : '--'}
              </div>
              <span className="text-[11px] text-slate-400">Capacitive Sensor v1.2</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Ambient Temperature</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {displayTemp(activeReading.temperature)}
              </div>
              <span className="text-[11px] text-slate-400">DHT22 Digital Probe</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Relative Humidity</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {activeReading.humidity !== null ? `${activeReading.humidity}%` : '--'}
              </div>
              <span className="text-[11px] text-slate-400">Air Vapor Pressure</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Station Battery & Link</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {activeStation.battery > 0 ? `${activeStation.battery}%` : '--'}
              </div>
              <span className="text-[11px] text-slate-400">
                {readingAgeMinutes !== null ? `${readingAgeMinutes}m ago` : 'Awaiting Connection'}
              </span>
            </div>
          </div>

          {/* Historical Graph for this specific sensor */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Soil Moisture Ingestion Series for {activeStation.name}
            </h3>
            <div className="h-56 flex items-center justify-center">
              {stationGraphData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stationGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      name="Moisture (%)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 max-w-sm">
                  <Radio className="w-6 h-6 text-slate-400 mx-auto mb-1 animate-pulse" />
                  <p className="font-semibold text-slate-700">No Telemetry Recorded for {activeStation.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Connect physical ESP32 or use the injector on the right to transmit live packets</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry Transmitter Panel (Real-Time Hardware Bridge Tool) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Zap className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">ESP32 Live Packet Injector</h3>
                <p className="text-[11px] text-slate-500">Transmit real-time telemetry directly to active node</p>
              </div>
            </div>

            <form onSubmit={handleSendPacket} className="space-y-4 mt-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Soil Moisture:</span>
                  <span className="font-bold text-emerald-800 text-sm">{txMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={txMoisture}
                  onChange={(e) => setTxMoisture(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Temperature:</span>
                  <span className="font-bold text-amber-800 text-sm">{txTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="0.5"
                  value={txTemp}
                  onChange={(e) => setTxTemp(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Relative Humidity:</span>
                  <span className="font-bold text-blue-800 text-sm">{txHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={txHumidity}
                  onChange={(e) => setTxHumidity(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Battery Level:</span>
                  <span className="font-bold text-slate-800">{txBattery}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={txBattery}
                  onChange={(e) => setTxBattery(Number(e.target.value))}
                  className="w-full accent-slate-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isTransmitting}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isTransmitting ? 'Broadcasting...' : 'Broadcast Live Packet'}</span>
              </button>

              {txSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-semibold text-center animate-in fade-in">
                  {txSuccessMessage}
                </div>
              )}
            </form>
          </div>

          {/* Recent Ingested Packets Feed */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Recent Raw Ingested Packets ({historicalReadings.length} total)
            </span>
            <div className="space-y-1.5 font-mono text-[10px]">
              {recentPackets.map((pkt) => (
                <div key={pkt.id} className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600 truncate max-w-[90px]">{pkt.stationId.replace('station-', '')}</span>
                  <span className="font-bold text-emerald-800">{pkt.soilMoisture}%</span>
                  <span className="text-amber-800">{pkt.temperature}°C</span>
                  <span className="text-slate-400">{new Date(pkt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

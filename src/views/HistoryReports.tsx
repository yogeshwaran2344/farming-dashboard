import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  History,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { calculateReadingStats } from '../utils/ruleEngine';

export const HistoryReports: React.FC = () => {
  const {
    t,
    language,
    tempUnit,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    historicalReadings,
  } = useFarm();

  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days' | '30days'>('7days');
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const displayTemp = (tempC: number) => {
    if (tempUnit === 'F') return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    return `${tempC}°C`;
  };

  // Filter readings by selected field and time filter with strict deduplication
  const filteredReadings = useMemo(() => {
    const now = Date.now();
    const fieldData = historicalReadings.filter(r => r.fieldId === selectedFieldId);

    let cutoffHours = 24 * 7;
    if (timeFilter === 'today') cutoffHours = 24;
    if (timeFilter === 'yesterday') cutoffHours = 48;
    if (timeFilter === '7days') cutoffHours = 24 * 7;
    if (timeFilter === '30days') cutoffHours = 24 * 30;

    const cutoffMs = cutoffHours * 60 * 60 * 1000;
    const timeFiltered = fieldData.filter(r => now - new Date(r.timestamp).getTime() <= cutoffMs);
    const baseList = timeFiltered.length > 0 ? timeFiltered : fieldData;

    // Deduplicate timestamps
    const seen = new Set<string>();
    return baseList.filter(r => {
      if (seen.has(r.timestamp)) return false;
      seen.add(r.timestamp);
      return true;
    });
  }, [historicalReadings, selectedFieldId, timeFilter]);

  // Statistical calculations
  const stats = useMemo(() => {
    return calculateReadingStats(filteredReadings);
  }, [filteredReadings]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredReadings
      .filter(r => r.isValid)
      .map(r => {
        const d = new Date(r.timestamp);
        return {
          time: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
          moisture: r.soilMoisture,
          temperature: tempUnit === 'F' ? Math.round((r.temperature * 9) / 5 + 32) : r.temperature,
          humidity: r.humidity,
        };
      });
  }, [filteredReadings, tempUnit]);

  // Download CSV export function
  const handleExportCsv = () => {
    const activeField = fields.find(f => f.id === selectedFieldId);
    const headers = ['Timestamp', 'Field_Name', 'Crop', 'Soil_Moisture_Pct', `Temperature_${tempUnit}`, 'Humidity_RH_Pct', 'Data_Validity'];
    
    const rows = filteredReadings.map(r => {
      const tempVal = tempUnit === 'F' ? Math.round((r.temperature * 9) / 5 + 32) : r.temperature;
      return [
        `"${r.timestamp}"`,
        `"${activeField?.name || ''}"`,
        `"${activeField?.cropType || ''}"`,
        r.soilMoisture,
        tempVal,
        r.humidity,
        r.isValid ? 'VALID' : 'INVALID_OR_STALE',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmsense_report_${selectedFieldId}_${timeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination for readings table
  const paginatedReadings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReadings.slice(start, start + pageSize);
  }, [filteredReadings, currentPage]);

  const totalPages = Math.ceil(filteredReadings.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.reports.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
          <span>{t.reports.exportCsv}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Field Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Field:</span>
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {fields.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.cropType})
              </option>
            ))}
          </select>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeFilter === 'today' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.reports.today}
          </button>
          <button
            onClick={() => setTimeFilter('yesterday')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeFilter === 'yesterday' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.reports.yesterday}
          </button>
          <button
            onClick={() => setTimeFilter('7days')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeFilter === '7days' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.reports.last7Days}
          </button>
          <button
            onClick={() => setTimeFilter('30days')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeFilter === '30days' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.reports.last30Days}
          </button>
        </div>
      </div>

      {/* Calculated Statistical Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.reports.avgMoisture}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {stats.count > 0 ? `${stats.avgMoisture}%` : '--'}
          </div>
          <span className="text-[11px] text-slate-500">Root zone average</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.reports.minMoisture}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-700">
            {stats.count > 0 ? `${stats.minMoisture}%` : '--'}
          </div>
          <span className="text-[11px] text-slate-500">Lowest deficit point</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.reports.maxMoisture}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-700">
            {stats.count > 0 ? `${stats.maxMoisture}%` : '--'}
          </div>
          <span className="text-[11px] text-slate-500">Peak post-irrigation</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.reports.validReadingsCount}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
            {stats.count}
          </div>
          <span className="text-[11px] text-slate-500">Integrity verified samples</span>
        </div>
      </div>

      {/* Comprehensive Multi-Series Graph */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-base text-slate-900">
          Recorded Telemetry Profiles for Selected Period
        </h3>
        <div className="h-72 flex items-center justify-center">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="moisture"
                  name="Soil Moisture (%)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name={`Temperature (${tempUnit === 'F' ? '°F' : '°C'})`}
                  stroke="#ea580c"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Air Humidity (%)"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl max-w-sm">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700">No Telemetry Recorded Yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Telemetry records will populate here automatically as soon as ESP32 nodes connect or manual field readings are entered.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recorded Sensor Readings Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Sensor Reading Log Entries ({filteredReadings.length} total)
          </h3>
          <span className="text-xs text-slate-400">Page {currentPage} of {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">{t.reports.tableTimestamp}</th>
                <th className="py-2.5 px-3">{t.reports.tableMoisture}</th>
                <th className="py-2.5 px-3">{t.reports.tableTemp} ({tempUnit === 'F' ? '°F' : '°C'})</th>
                <th className="py-2.5 px-3">{t.reports.tableHumidity}</th>
                <th className="py-2.5 px-3">{t.reports.tableHealth}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedReadings.length > 0 ? (
                paginatedReadings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {r.isValid ? `${r.soilMoisture}%` : '--'}
                    </td>
                    <td className="py-2.5 px-3">
                      {displayTemp(r.temperature)}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.humidity}%
                    </td>
                    <td className="py-2.5 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flagged</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No sensor readings recorded for this field. Awaiting live telemetry or manual input.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

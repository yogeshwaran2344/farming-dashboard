import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  AlertTriangle,
  AlertOctagon,
  WifiOff,
  CheckCircle2,
  Droplet,
  Check,
  Trash2,
  Filter,
  Clock,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { AlertCategory } from '../types';

export const AlertsView: React.FC = () => {
  const {
    t,
    alerts,
    acknowledgeAlert,
    resolveAlert,
    clearAllAlerts,
    fields,
  } = useFarm();

  const [activeCategory, setActiveCategory] = useState<AlertCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false;
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, activeCategory, severityFilter]);

  const categories = [
    { id: 'all', label: t.alerts.categories.all, count: alerts.length },
    { id: 'moisture', label: t.alerts.categories.moisture, count: alerts.filter(a => a.category === 'moisture').length },
    { id: 'connectivity', label: t.alerts.categories.connectivity, count: alerts.filter(a => a.category === 'connectivity').length },
    { id: 'fault', label: t.alerts.categories.fault, count: alerts.filter(a => a.category === 'fault').length },
    { id: 'resolved', label: t.alerts.categories.resolved, count: alerts.filter(a => a.status === 'resolved').length },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Action Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.alerts.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Categorized notifications, connectivity warnings, and fault resolution records
          </p>
        </div>

        <button
          onClick={clearAllAlerts}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition self-start md:self-auto"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Resolved</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === cat.id ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alert Items List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">{t.alerts.empty}</h3>
            <p className="text-xs text-slate-500 mt-1">
              No warnings logged for the selected filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alt => {
            const isCrit = alt.severity === 'critical';
            const isWarn = alt.severity === 'warning';
            const isResolved = alt.status === 'resolved';
            const field = fields.find(f => f.id === alt.fieldId);

            return (
              <div
                key={alt.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-50/80 border-slate-200 text-slate-600 opacity-80'
                    : isCrit
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm'
                    : isWarn
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm'
                    : 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isResolved
                        ? 'bg-slate-200 text-slate-600'
                        : isCrit
                        ? 'bg-rose-600 text-white'
                        : isWarn
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alt.category === 'moisture' ? (
                        <Droplet className="w-5 h-5" />
                      ) : alt.category === 'connectivity' ? (
                        <WifiOff className="w-5 h-5" />
                      ) : (
                        <AlertOctagon className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isResolved
                            ? 'bg-slate-200 text-slate-700'
                            : isCrit
                            ? 'bg-rose-200 text-rose-900'
                            : isWarn
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}>
                          {alt.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(alt.timestamp).toLocaleString()}</span>
                        </span>
                        {field && (
                          <span className="text-xs text-slate-600 font-semibold bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                            {field.name}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {alt.title}
                      </h3>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {alt.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {!isResolved && alt.status === 'active' && (
                      <button
                        onClick={() => acknowledgeAlert(alt.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 font-semibold text-xs border border-slate-300 transition"
                      >
                        {t.alerts.acknowledge}
                      </button>
                    )}
                    {!isResolved && (
                      <button
                        onClick={() => resolveAlert(alt.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                      >
                        {t.alerts.resolve}
                      </button>
                    )}
                    {isResolved && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

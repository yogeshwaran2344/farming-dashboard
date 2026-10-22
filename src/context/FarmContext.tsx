import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FieldZone,
  SensorStation,
  SensorReading,
  AlertItem,
  Language,
  TemperatureUnit,
  PumpState,
  HardwareSettings,
  IrrigationRecommendation,
  DataSourceMode,
  ValidatedSensorReading,
  FarmActivityItem,
  PlannerTask,
  FarmDiaryEntry,
  FarmExpenseEntry,
  LiveConnectionStatus,
} from '../types';
import {
  INITIAL_FIELDS,
  INITIAL_STATIONS,
  INITIAL_ALERTS,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS,
  INITIAL_DIARY,
  INITIAL_EXPENSES,
  INITIAL_READINGS,
} from '../utils/mockData';
import { evaluateIrrigationRule } from '../utils/ruleEngine';
import { validateSensorReading } from '../utils/validator';
import { getTranslation } from '../utils/translations';

// Configurable API base for cloud deployment (e.g. Render / Cloud Run)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Strict deduplication: maintains uniquely identified time-series without duplicated timestamps
export function deduplicateAndSortReadings(readings: SensorReading[]): SensorReading[] {
  const map = new Map<string, SensorReading>();
  for (const r of readings) {
    const key = `${r.fieldId}_${r.timestamp}`;
    map.set(key, r);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

interface FarmContextType {
  // Navigation & Localization
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  tempUnit: TemperatureUnit;
  setTempUnit: (unit: TemperatureUnit) => void;
  t: ReturnType<typeof getTranslation>;

  // Data Source Mode (Strictly Real-Time Live)
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;

  // Real-Time Live Status
  liveConnectionStatus: LiveConnectionStatus;
  totalPacketsReceived: number;
  lastReceivedTime: string | null;
  recordUserReading: (fieldId: string, moisture: number, temperature: number, humidity: number) => Promise<void>;
  clearAllReadings: () => void;
  transmitTelemetry: (payload: {
    stationId: string;
    fieldId: string;
    soilMoisture: number;
    temperature: number;
    humidity: number;
    battery?: number;
    signalRssi?: number;
  }) => Promise<void>;

  // Fields
  fields: FieldZone[];
  selectedFieldId: string;
  selectedField: FieldZone | undefined;
  setSelectedFieldId: (id: string) => void;
  addField: (field: Omit<FieldZone, 'id'>) => void;
  updateField: (field: FieldZone) => void;
  deleteField: (id: string) => void;

  // Centralized Stations & Validated Telemetry
  stations: SensorStation[];
  historicalReadings: SensorReading[];
  validatedReading: ValidatedSensorReading; // Authoritative single source for active field
  getValidatedReadingForField: (fieldId: string) => ValidatedSensorReading;
  getStationForField: (fieldId: string) => SensorStation | undefined;
  refreshData: () => void;
  isAutoRefreshing: boolean;
  setIsAutoRefreshing: (val: boolean) => void;

  // Advisory & Recommendation (Evaluated from Central Validated Reading)
  currentRecommendation: IrrigationRecommendation;

  // Alerts & Activities
  alerts: AlertItem[];
  unreadAlertCount: number;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  clearAllAlerts: () => void;
  activities: FarmActivityItem[];
  addActivity: (act: Omit<FarmActivityItem, 'id' | 'timestamp'>) => void;

  // Farm Planner Tasks
  tasks: PlannerTask[];
  toggleTask: (id: string) => void;
  addTask: (task: Omit<PlannerTask, 'id' | 'completed'>) => void;

  // Personal Farm Diary
  diaryEntries: FarmDiaryEntry[];
  addDiaryEntry: (entry: Omit<FarmDiaryEntry, 'id'>) => void;

  // Farm Expense Tracker
  expenses: FarmExpenseEntry[];
  addExpense: (expense: Omit<FarmExpenseEntry, 'id'>) => void;

  // Pump Controller
  pumpState: PumpState;
  startPump: () => void;
  stopPump: () => void;
  emergencyStopPump: () => void;

  // Hardware Settings
  hardwareSettings: HardwareSettings;
  updateHardwareSettings: (settings: Partial<HardwareSettings>) => void;
  simulateCondition: (condition: string) => void;
  currentSimulation: string;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Localization
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('farmsense_lang') as Language) || 'en';
  });

  const [tempUnit, setTempUnitState] = useState<TemperatureUnit>(() => {
    return (localStorage.getItem('farmsense_unit') as TemperatureUnit) || 'C';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmsense_lang', lang);
  };

  const setTempUnit = (unit: TemperatureUnit) => {
    setTempUnitState(unit);
    localStorage.setItem('farmsense_unit', unit);
  };

  const t = getTranslation(language);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Data Source Mode: Strictly Real-Time Live
  const [dataSourceMode] = useState<DataSourceMode>('live');
  const setDataSourceMode = (_mode: DataSourceMode) => {
    // Mode is locked to real-time live telemetry
  };

  // Real-Time Connection State
  const [liveConnectionStatus, setLiveConnectionStatus] = useState<LiveConnectionStatus>('listening');
  const [totalPacketsReceived, setTotalPacketsReceived] = useState<number>(0);
  const [lastReceivedTime, setLastReceivedTime] = useState<string | null>(null);

  // Fields State
  const [fields, setFields] = useState<FieldZone[]>(() => {
    const saved = localStorage.getItem('farmsense_fields');
    return saved ? JSON.parse(saved) : INITIAL_FIELDS;
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || 'field-1');

  useEffect(() => {
    localStorage.setItem('farmsense_fields', JSON.stringify(fields));
  }, [fields]);

  // Stations State
  const [stations, setStations] = useState<SensorStation[]>(INITIAL_STATIONS);

  // Authoritative Telemetry Store: Nil values until real sensors connect or user inputs telemetry
  const [readings, setReadings] = useState<SensorReading[]>(() => {
    // Clear any previous mock legacy data to guarantee clean nil baseline
    const isWiped = localStorage.getItem('farmsense_v3_nil_baseline');
    if (!isWiped) {
      localStorage.removeItem('farmsense_realtime_readings');
      localStorage.removeItem('farmsense_alerts');
      localStorage.setItem('farmsense_v3_nil_baseline', 'true');
      return [];
    }
    const saved = localStorage.getItem('farmsense_realtime_readings');
    if (saved) {
      try {
        const parsed: SensorReading[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateAndSortReadings(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved readings", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('farmsense_realtime_readings', JSON.stringify(readings.slice(-300)));
  }, [readings]);

  // Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('farmsense_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  useEffect(() => {
    localStorage.setItem('farmsense_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Farm Activity Log State
  const [activities, setActivities] = useState<FarmActivityItem[]>(() => {
    const saved = localStorage.getItem('farmsense_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  useEffect(() => {
    localStorage.setItem('farmsense_activities', JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((act: Omit<FarmActivityItem, 'id' | 'timestamp'>) => {
    const newAct: FarmActivityItem = {
      ...act,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newAct, ...prev.slice(0, 49)]);
  }, []);

  // Planner Tasks State
  const [tasks, setTasks] = useState<PlannerTask[]>(() => {
    const saved = localStorage.getItem('farmsense_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('farmsense_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (newTask: Omit<PlannerTask, 'id' | 'completed'>) => {
    const task: PlannerTask = {
      ...newTask,
      id: `tsk-${Date.now()}`,
      completed: false,
    };
    setTasks(prev => [task, ...prev]);
    addActivity({
      type: 'system',
      title: 'Task Created',
      description: `New task added: "${task.title}".`,
      badge: 'Planner'
    });
  };

  // Personal Diary State
  const [diaryEntries, setDiaryEntries] = useState<FarmDiaryEntry[]>(() => {
    const saved = localStorage.getItem('farmsense_diary');
    return saved ? JSON.parse(saved) : INITIAL_DIARY;
  });

  useEffect(() => {
    localStorage.setItem('farmsense_diary', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  const addDiaryEntry = (entry: Omit<FarmDiaryEntry, 'id'>) => {
    const newEntry: FarmDiaryEntry = {
      ...entry,
      id: `dry-${Date.now()}`,
    };
    setDiaryEntries(prev => [newEntry, ...prev]);
    addActivity({
      type: entry.type === 'irrigation' ? 'irrigation' : 'system',
      title: 'Diary Entry Logged',
      description: `${entry.type.toUpperCase()}: ${entry.notes.slice(0, 60)}...`,
      fieldId: entry.fieldId,
      badge: 'Diary'
    });
  };

  // Expense Tracker State
  const [expenses, setExpenses] = useState<FarmExpenseEntry[]>(() => {
    const saved = localStorage.getItem('farmsense_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  useEffect(() => {
    localStorage.setItem('farmsense_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (newExp: Omit<FarmExpenseEntry, 'id'>) => {
    const item: FarmExpenseEntry = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [item, ...prev]);
    addActivity({
      type: 'system',
      title: 'Expense Recorded',
      description: `₹${item.amount} recorded for ${item.category} (${item.description}).`,
      fieldId: item.fieldId,
      badge: 'Expense'
    });
  };

  // Pump State
  const [pumpState, setPumpState] = useState<PumpState>({
    status: 'OFF',
    mode: 'manual',
    autoOffMinutes: 30,
    activeRemainingSeconds: 0,
    isEmergencyStopped: false,
    hardwareConnected: true,
  });

  // Hardware & Polling Settings
  const [hardwareSettings, setHardwareSettings] = useState<HardwareSettings>({
    mode: 'live',
    apiEndpoint: `${API_BASE}/api/readings/latest`,
    apiKey: 'agr-esp32-key-live',
    pollIntervalSeconds: 3,
    connectionStatus: 'listening',
    totalPacketsReceived: 0,
    lastReceivedTime: null,
  });

  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);

  // Active Field helper
  const selectedField = fields.find(f => f.id === selectedFieldId) || fields[0];

  const getStationForField = useCallback((fieldId: string): SensorStation | undefined => {
    const f = fields.find(item => item.id === fieldId);
    if (!f) return undefined;
    return stations.find(s => s.id === f.assignedStationId) || stations[0];
  }, [fields, stations]);

  // Centralized Data Validation Pipeline
  const getValidatedReadingForField = useCallback((fieldId: string): ValidatedSensorReading => {
    const fieldReadings = readings.filter(r => r.fieldId === fieldId);
    const rawReading = fieldReadings.length > 0 ? fieldReadings[fieldReadings.length - 1] : undefined;
    const station = getStationForField(fieldId);

    return validateSensorReading(rawReading, station, fieldId, 'live');
  }, [readings, getStationForField]);

  // Central Authoritative Validated Reading for Active Field
  const validatedReading = useMemo(() => {
    return getValidatedReadingForField(selectedFieldId);
  }, [getValidatedReadingForField, selectedFieldId]);

  // Authoritative Rule-Based Recommendation generated from Central Validated Reading
  const currentRecommendation = useMemo(() => {
    return evaluateIrrigationRule(validatedReading, selectedField, language);
  }, [validatedReading, selectedField, language]);

  // Unread Alert Count
  const unreadAlertCount = alerts.filter(a => a.status === 'active').length;

  // Direct Telemetry Transmission: Ingests packet into local pipeline & POSTs to FastAPI backend
  const transmitTelemetry = useCallback(async (payload: {
    stationId: string;
    fieldId: string;
    soilMoisture: number;
    temperature: number;
    humidity: number;
    battery?: number;
    signalRssi?: number;
  }) => {
    const timestamp = new Date().toISOString();
    const newReading: SensorReading = {
      id: `read-${payload.fieldId}-${Date.now()}`,
      timestamp,
      stationId: payload.stationId,
      fieldId: payload.fieldId,
      soilMoisture: Math.round(payload.soilMoisture * 10) / 10,
      temperature: Math.round(payload.temperature * 10) / 10,
      humidity: Math.round(payload.humidity),
      isValid: payload.soilMoisture >= 0 && payload.soilMoisture <= 100 && payload.temperature >= -10 && payload.temperature <= 60,
      battery: payload.battery ?? 90,
      signalRssi: payload.signalRssi ?? -65,
    };

    // Deduplicate and update local store
    setReadings(prev => deduplicateAndSortReadings([...prev, newReading]));
    setTotalPacketsReceived(c => c + 1);
    setLastReceivedTime(timestamp);
    setLiveConnectionStatus('connected');

    // Update station state
    setStations(prev => prev.map(s => {
      if (s.id === payload.stationId) {
        return {
          ...s,
          lastSeen: timestamp,
          battery: payload.battery ?? s.battery,
          status: 'online',
        };
      }
      return s;
    }));

    // Post to FastAPI backend if available
    try {
      await fetch(`${API_BASE}/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-token': hardwareSettings.apiKey,
        },
        body: JSON.stringify({
          stationId: payload.stationId,
          fieldId: payload.fieldId,
          soilMoisture: newReading.soilMoisture,
          temperature: newReading.temperature,
          humidity: newReading.humidity,
          battery: newReading.battery,
          signalRssi: newReading.signalRssi,
          timestamp,
        }),
      });
    } catch (e) {
      // Local mode fallback if backend server is not running
    }
  }, [hardwareSettings.apiKey]);

  // Manual Reading Entry: Ingests user-inputted observation for a field
  const recordUserReading = useCallback(async (
    fieldId: string,
    moisture: number,
    temperature: number,
    humidity: number
  ) => {
    const station = getStationForField(fieldId);
    const stationId = station?.id || `station-manual-${fieldId}`;
    const timestamp = new Date().toISOString();

    const newReading: SensorReading = {
      id: `read-user-${fieldId}-${Date.now()}`,
      timestamp,
      stationId,
      fieldId,
      soilMoisture: Math.round(moisture * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      isValid: moisture >= 0 && moisture <= 100 && temperature >= -10 && temperature <= 60 && humidity >= 5 && humidity <= 100,
      battery: 100,
      signalRssi: -50,
    };

    setReadings(prev => deduplicateAndSortReadings([...prev, newReading]));
    setTotalPacketsReceived(c => c + 1);
    setLastReceivedTime(timestamp);
    setLiveConnectionStatus('connected');

    setStations(prev => prev.map(s => {
      if (s.id === stationId) {
        return {
          ...s,
          lastSeen: timestamp,
          battery: 100,
          status: 'online',
        };
      }
      return s;
    }));

    addActivity({
      type: 'telemetry',
      title: 'Manual Field Reading Inputted',
      description: `User recorded observation for ${fields.find(f => f.id === fieldId)?.name || fieldId}: Soil Moisture ${moisture}%, Temp ${temperature}°C, Humidity ${humidity}%.`,
      fieldId,
      badge: 'User Input'
    });

    try {
      await fetch(`${API_BASE}/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-token': hardwareSettings.apiKey,
        },
        body: JSON.stringify({
          stationId,
          fieldId,
          soilMoisture: newReading.soilMoisture,
          temperature: newReading.temperature,
          humidity: newReading.humidity,
          battery: 100,
          signalRssi: -50,
          timestamp,
        }),
      });
    } catch (err) {
      // Offline fallback
    }
  }, [getStationForField, fields, hardwareSettings.apiKey, addActivity]);

  const clearAllReadings = useCallback(() => {
    setReadings([]);
    setTotalPacketsReceived(0);
    setLastReceivedTime(null);
    setLiveConnectionStatus('listening');
    setStations(prev => prev.map(s => ({
      ...s,
      status: 'offline',
      lastSeen: '',
      battery: 0,
    })));
    localStorage.removeItem('farmsense_realtime_readings');
  }, []);

  // Real-Time Poller Loop (Fetches fresh telemetry from FastAPI backend every N seconds)
  useEffect(() => {
    if (!isAutoRefreshing) return;

    let isSubscribed = true;

    const pollBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/readings/latest`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const incoming: SensorReading[] = await res.json();
        if (!isSubscribed || !Array.isArray(incoming) || incoming.length === 0) return;

        setReadings(prev => {
          const combined = deduplicateAndSortReadings([...prev, ...incoming]);
          return combined;
        });

        setLiveConnectionStatus('connected');
        setTotalPacketsReceived(c => c + incoming.length);
        const latestTime = incoming[0]?.timestamp || new Date().toISOString();
        setLastReceivedTime(latestTime);

        // Update station statuses based on incoming readings
        incoming.forEach(inc => {
          setStations(stationsList => stationsList.map(st => {
            if (st.id === inc.stationId) {
              return {
                ...st,
                lastSeen: inc.timestamp,
                battery: inc.battery ?? st.battery,
                status: inc.isValid ? 'online' : 'warning',
              };
            }
            return st;
          }));
        });
      } catch (err) {
        if (isSubscribed) {
          // If backend isn't responding yet, flag as listening / standalone
          setLiveConnectionStatus(prev => prev === 'connected' ? 'listening' : prev);
        }
      }
    };

    // Initial query
    pollBackend();

    const interval = setInterval(
      pollBackend,
      Math.max(1500, (hardwareSettings.pollIntervalSeconds || 3) * 1000)
    );

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isAutoRefreshing, hardwareSettings.pollIntervalSeconds]);

  // Pump Countdown Timer Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (pumpState.status === 'ON' && pumpState.activeRemainingSeconds > 0) {
      interval = setInterval(() => {
        setPumpState(prev => {
          if (prev.activeRemainingSeconds <= 1) {
            const newAlert: AlertItem = {
              id: `alt-${Date.now()}`,
              category: 'moisture',
              severity: 'info',
              title: 'Pump Auto-Cutoff Triggered',
              message: 'Irrigation pump completed scheduled 30-minute run and turned off automatically.',
              timestamp: new Date().toISOString(),
              fieldId: selectedFieldId,
              status: 'active',
            };
            setAlerts(a => [newAlert, ...a]);
            return {
              ...prev,
              status: 'OFF',
              activeRemainingSeconds: 0,
            };
          }
          return {
            ...prev,
            activeRemainingSeconds: prev.activeRemainingSeconds - 1,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pumpState.status, pumpState.activeRemainingSeconds, selectedFieldId]);

  // Actions
  const refreshData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/readings/latest`);
      if (res.ok) {
        const incoming: SensorReading[] = await res.json();
        if (Array.isArray(incoming)) {
          setReadings(prev => deduplicateAndSortReadings([...prev, ...incoming]));
          setLiveConnectionStatus('connected');
        }
      }
    } catch (e) {
      // Standalone refresh
    }
  };

  const addField = (newFieldData: Omit<FieldZone, 'id'>) => {
    const id = `field-${Date.now()}`;
    const field: FieldZone = { ...newFieldData, id };
    setFields(prev => [...prev, field]);
    setSelectedFieldId(id);
  };

  const updateField = (updated: FieldZone) => {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    addActivity({
      type: 'threshold',
      title: 'Field Settings Updated',
      description: `Target thresholds saved for ${updated.name}: ${updated.targetMoistureMin}% – ${updated.targetMoistureMax}%.`,
      fieldId: updated.id,
      badge: 'Config'
    });
  };

  const deleteField = (id: string) => {
    if (fields.length <= 1) return;
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(fields.find(f => f.id !== id)?.id || '');
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    addActivity({
      type: 'alert',
      title: 'Alert Acknowledged',
      description: `Operator acknowledged alert #${id.slice(-4)}.`,
      badge: 'Ack'
    });
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a));
    addActivity({
      type: 'alert',
      title: 'Alert Marked Resolved',
      description: `Alert condition verified and cleared.`,
      badge: 'Resolved'
    });
  };

  const clearAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, status: 'resolved', resolvedAt: new Date().toISOString() })));
  };

  const startPump = () => {
    // Safety check: Never start pump if reading is stale or invalid
    if (!validatedReading.isLiveReliable) {
      alert("Safety Lockout: Cannot start pump with stale, missing, or invalid sensor readings.");
      return;
    }

    setPumpState({
      status: 'ON',
      mode: 'manual',
      autoOffMinutes: 30,
      activeRemainingSeconds: 30 * 60,
      isEmergencyStopped: false,
      lastRunTimestamp: new Date().toISOString(),
      hardwareConnected: true,
    });

    const newAlert: AlertItem = {
      id: `alt-${Date.now()}`,
      category: 'moisture',
      severity: 'info',
      title: 'Irrigation Pump Activated',
      message: `Manual pump started for ${selectedField?.name}. Auto shutoff armed for 30 minutes.`,
      timestamp: new Date().toISOString(),
      fieldId: selectedFieldId,
      status: 'active',
    };
    setAlerts(prev => [newAlert, ...prev]);

    addActivity({
      type: 'irrigation',
      title: 'Irrigation Pump Started',
      description: `Started 30-min run for ${selectedField?.name} (${selectedField?.irrigationMethod}).`,
      fieldId: selectedFieldId,
      badge: 'Pump Running'
    });
  };

  const stopPump = () => {
    setPumpState(prev => ({
      ...prev,
      status: 'OFF',
      activeRemainingSeconds: 0,
    }));

    addActivity({
      type: 'irrigation',
      title: 'Irrigation Pump Stopped',
      description: `Pump stopped for ${selectedField?.name}. Line pressure restored.`,
      fieldId: selectedFieldId,
      badge: 'Pump Standby'
    });
  };

  const emergencyStopPump = () => {
    setPumpState({
      status: 'OFF',
      mode: 'manual',
      autoOffMinutes: 30,
      activeRemainingSeconds: 0,
      isEmergencyStopped: true,
      hardwareConnected: true,
    });

    const emergencyAlert: AlertItem = {
      id: `alt-${Date.now()}`,
      category: 'fault',
      severity: 'critical',
      title: 'EMERGENCY STOP Activated',
      message: 'Operator triggered Emergency Shutoff. Pump output power killed immediately.',
      timestamp: new Date().toISOString(),
      fieldId: selectedFieldId,
      status: 'active',
    };
    setAlerts(prev => [emergencyAlert, ...prev]);

    addActivity({
      type: 'system',
      title: 'Emergency Shutoff Triggered',
      description: 'Operator pressed physical/UI Emergency Stop cut-out switch.',
      fieldId: selectedFieldId,
      badge: 'EMERGENCY'
    });
  };

  const updateHardwareSettings = (settings: Partial<HardwareSettings>) => {
    setHardwareSettings(prev => ({ ...prev, ...settings }));
  };

  const simulateCondition = (_condition: string) => {
    // Demo simulation deprecated: all updates flow through real-time telemetry
  };

  return (
    <FarmContext.Provider
      value={{
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        tempUnit,
        setTempUnit,
        t,
        dataSourceMode,
        setDataSourceMode,
        liveConnectionStatus,
        totalPacketsReceived,
        lastReceivedTime,
        transmitTelemetry,
        recordUserReading,
        clearAllReadings,
        fields,
        selectedFieldId,
        selectedField,
        setSelectedFieldId,
        addField,
        updateField,
        deleteField,
        stations,
        historicalReadings: readings,
        validatedReading,
        getValidatedReadingForField,
        getStationForField,
        refreshData,
        isAutoRefreshing,
        setIsAutoRefreshing,
        currentRecommendation,
        alerts,
        unreadAlertCount,
        acknowledgeAlert,
        resolveAlert,
        clearAllAlerts,
        activities,
        addActivity,
        tasks,
        toggleTask,
        addTask,
        diaryEntries,
        addDiaryEntry,
        expenses,
        addExpense,
        pumpState,
        startPump,
        stopPump,
        emergencyStopPump,
        hardwareSettings,
        updateHardwareSettings,
        simulateCondition,
        currentSimulation: 'realtime',
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};

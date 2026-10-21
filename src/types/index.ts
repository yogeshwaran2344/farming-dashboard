export type Language = 'en' | 'kn';

export type TemperatureUnit = 'C' | 'F';

export type DataSourceMode = 'live';
export type LiveConnectionStatus = 'connected' | 'listening' | 'offline';

export type ReadingValidationStatus = 'fresh' | 'stale' | 'invalid' | 'missing' | 'disconnected';

export interface SensorReading {
  id: string;
  timestamp: string; // ISO string
  fieldId: string;
  stationId: string;
  soilMoisture: number; // percentage 0-100
  temperature: number; // in Celsius
  humidity: number; // % RH
  isValid: boolean;
  battery?: number; // %
  signalRssi?: number; // dBm
  rawAdc?: number; // Optional raw 12-bit ADC value (0-4095) for calibration
}

export interface ValidatedSensorReading {
  rawReading: SensorReading | null;
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
  timestamp: string | null;
  stalenessMinutes: number;
  status: ReadingValidationStatus;
  isLiveReliable: boolean; // True only if fresh, valid, and connected
  validationErrors: string[];
  dataSource: DataSourceMode;
  fieldId: string;
  stationId: string;
  battery?: number;
  signalRssi?: number;
}

export interface FieldZone {
  id: string;
  name: string;
  area: number;
  areaUnit: 'Acres' | 'Hectares' | 'Guntas';
  cropType: string;
  cropStage: string;
  soilType: string;
  assignedStationId: string;
  irrigationMethod: string;
  targetMoistureMin: number; // e.g. 40%
  targetMoistureMax: number; // e.g. 70%
  notes?: string;
}

export interface SensorStation {
  id: string;
  name: string;
  fieldId: string;
  status: 'online' | 'offline' | 'warning' | 'unconfigured';
  lastSeen: string;
  battery: number;
  firmware: string;
  hardwareModel: string;
  ipAddress?: string;
  lastErrorMessage?: string;
}

export type AlertCategory = 'moisture' | 'connectivity' | 'fault' | 'resolved';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  fieldId: string;
  stationId?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedAt?: string;
}

export interface FarmActivityItem {
  id: string;
  type: 'irrigation' | 'telemetry' | 'threshold' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: string;
  fieldId?: string;
  badge?: string;
}

export interface IrrigationRecommendation {
  status: 'low' | 'optimal' | 'high' | 'stale' | 'fault' | 'missing';
  title: string;
  action: string;
  reason: string;
  timestamp: string;
  urgency: 'urgent' | 'normal' | 'none' | 'caution';
  ruleTriggered: string;
  deficitOrSurplusPct: number;
}

export interface PumpState {
  status: 'OFF' | 'ON';
  mode: 'manual' | 'auto';
  autoOffMinutes: number;
  activeRemainingSeconds: number;
  isEmergencyStopped: boolean;
  lastRunTimestamp?: string;
  hardwareConnected: boolean;
}

export interface HardwareSettings {
  mode: DataSourceMode;
  apiEndpoint: string;
  apiKey: string;
  pollIntervalSeconds: number;
  connectionStatus?: LiveConnectionStatus;
  totalPacketsReceived?: number;
  lastReceivedTime?: string | null;
}

export interface PlannerTask {
  id: string;
  title: string;
  category: 'irrigation' | 'inspection' | 'fertilizer' | 'harvest' | 'general';
  dueDate: string;
  completed: boolean;
  fieldId?: string;
}

export interface FarmDiaryEntry {
  id: string;
  date: string;
  type: 'irrigation' | 'rainfall' | 'fertilizer' | 'observation' | 'pest';
  fieldId: string;
  notes: string;
  amount?: string;
}

export interface FarmExpenseEntry {
  id: string;
  date: string;
  fieldId: string;
  category: 'seed' | 'fertilizer' | 'labor' | 'irrigation' | 'equipment' | 'other';
  description: string;
  amount: number;
}

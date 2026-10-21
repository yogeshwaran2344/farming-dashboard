import { FieldZone, SensorStation, SensorReading, AlertItem, FarmActivityItem, PlannerTask, FarmDiaryEntry, FarmExpenseEntry } from '../types';

export const INITIAL_FIELDS: FieldZone[] = [
  {
    id: 'field-1',
    name: 'East Field — Plot 1',
    area: 2.5,
    areaUnit: 'Acres',
    cropType: 'Tomato (Hybrid)',
    cropStage: 'Flowering & Early Fruiting',
    soilType: 'Red Loamy Soil',
    assignedStationId: 'station-esp32-01',
    irrigationMethod: 'Drip Irrigation',
    targetMoistureMin: 45,
    targetMoistureMax: 75,
    notes: 'Sensitive flowering stage. Avoid water stress to prevent flower drop.'
  },
  {
    id: 'field-2',
    name: 'West Acre — Block 2',
    area: 3.8,
    areaUnit: 'Acres',
    cropType: 'Bt Cotton',
    cropStage: 'Vegetative Canopy',
    soilType: 'Medium Black Soil',
    assignedStationId: 'station-esp32-02',
    irrigationMethod: 'Drip with Venturi',
    targetMoistureMin: 38,
    targetMoistureMax: 68,
    notes: 'Good water retention. Deep root system.'
  },
  {
    id: 'field-3',
    name: 'South Terrace — Plot 3',
    area: 1.5,
    areaUnit: 'Acres',
    cropType: 'Green Chilli (Byadgi)',
    cropStage: 'Fruit Setting',
    soilType: 'Sandy Loam',
    assignedStationId: 'station-esp32-03',
    irrigationMethod: 'Micro Sprinklers',
    targetMoistureMin: 40,
    targetMoistureMax: 70,
    notes: 'Quick draining soil. Monitor daily during warm afternoons.'
  }
];

export const INITIAL_STATIONS: SensorStation[] = [
  {
    id: 'station-esp32-01',
    name: 'ESP32 Node Alpha',
    fieldId: 'field-1',
    status: 'offline',
    lastSeen: '',
    battery: 0,
    firmware: 'v1.4.2-agr',
    hardwareModel: 'ESP32-WROOM-32D + Capacitive Soil v1.2 + DHT22',
    ipAddress: '192.168.1.142',
  },
  {
    id: 'station-esp32-02',
    name: 'ESP32 Node Beta',
    fieldId: 'field-2',
    status: 'offline',
    lastSeen: '',
    battery: 0,
    firmware: 'v1.4.2-agr',
    hardwareModel: 'ESP32-WROOM-32D + Capacitive Soil v1.2 + DHT22',
    ipAddress: '192.168.1.145',
  },
  {
    id: 'station-esp32-03',
    name: 'ESP32 Node Gamma',
    fieldId: 'field-3',
    status: 'offline',
    lastSeen: '',
    battery: 0,
    firmware: 'v1.4.2-agr',
    hardwareModel: 'ESP32-WROOM-32D + Capacitive Soil v1.2 + DHT22',
    ipAddress: '192.168.1.148',
  }
];

// Pure Real-Time: Nil initial values until real physical sensors or user inputs telemetry
export const INITIAL_READINGS: SensorReading[] = [];

// Alerts remain empty until triggered by real sensor readings
export const INITIAL_ALERTS: AlertItem[] = [];

export const INITIAL_ACTIVITIES: FarmActivityItem[] = [
  {
    id: 'act-001',
    type: 'alert',
    title: 'Moisture Deficit Flagged',
    description: 'East Field — Plot 1 crossed below 45% lower moisture threshold for Tomato (Flowering).',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    fieldId: 'field-1',
    badge: 'Advisory Trigger'
  },
  {
    id: 'act-002',
    type: 'irrigation',
    title: 'Scheduled Pump Cutoff Completed',
    description: 'Venturi Drip cycle ran for 30 minutes in West Acre. Pump automatically powered off.',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    fieldId: 'field-2',
    badge: 'Auto Safety'
  },
  {
    id: 'act-003',
    type: 'telemetry',
    title: 'Telemetry Sync Burst Received',
    description: 'All 3 ESP32 field nodes transmitted verified ADC capacitive probe and DHT22 packets.',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    badge: 'Hardware Sync'
  },
  {
    id: 'act-004',
    type: 'threshold',
    title: 'Crop Threshold Profile Updated',
    description: 'Tomato target moisture range adjusted to 45% - 75% for early fruiting stage.',
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    fieldId: 'field-1',
    badge: 'Rule Updated'
  }
];

export const INITIAL_TASKS: PlannerTask[] = [
  {
    id: 'tsk-001',
    title: 'Inspect drip emitter lines and flush sub-mains',
    category: 'irrigation',
    dueDate: 'Today',
    completed: false,
    fieldId: 'field-1'
  },
  {
    id: 'tsk-002',
    title: 'Monitor tomato flower clusters for blossom thrips or wilt',
    category: 'inspection',
    dueDate: 'Tomorrow',
    completed: false,
    fieldId: 'field-1'
  },
  {
    id: 'tsk-003',
    title: 'Apply water-soluble 19:19:19 NPK via Venturi fertigation',
    category: 'fertilizer',
    dueDate: 'In 3 days',
    completed: true,
    fieldId: 'field-2'
  },
  {
    id: 'tsk-004',
    title: 'Check ESP32 solar charging panel clean glass surface',
    category: 'general',
    dueDate: 'This week',
    completed: false,
    fieldId: 'field-3'
  }
];

export const INITIAL_DIARY: FarmDiaryEntry[] = [
  {
    id: 'dry-001',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'irrigation',
    fieldId: 'field-1',
    amount: '90 mins (Drip)',
    notes: 'Ran drip irrigation cycle. Moisture recharged from 41% to 68%. No emitter clogging observed.'
  },
  {
    id: 'dry-002',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'rainfall',
    fieldId: 'field-2',
    amount: '12 mm',
    notes: 'Overnight rainfall. Soil surface damp, cancelled scheduled morning furrow irrigation.'
  },
  {
    id: 'dry-003',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'observation',
    fieldId: 'field-1',
    amount: 'Canopy check',
    notes: 'Tomato plants entered peak flowering. Foliage healthy deep green with active pollinator activity.'
  }
];

export const INITIAL_EXPENSES: FarmExpenseEntry[] = [
  {
    id: 'exp-001',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fieldId: 'field-1',
    category: 'irrigation',
    description: 'Drip inline filters and replacement grommets',
    amount: 850
  },
  {
    id: 'exp-002',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fieldId: 'field-1',
    category: 'fertilizer',
    description: '19:19:19 Water soluble NPK fertilizer (25kg)',
    amount: 1850
  },
  {
    id: 'exp-003',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fieldId: 'field-2',
    category: 'labor',
    description: 'Manual weeding and bed mulching labor (3 persons)',
    amount: 2100
  },
  {
    id: 'exp-004',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fieldId: 'field-1',
    category: 'seed',
    description: 'High-yield hybrid tomato seedling trays',
    amount: 3200
  }
];

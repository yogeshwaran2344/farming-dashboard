import { SensorReading, SensorStation, ValidatedSensorReading, DataSourceMode, ReadingValidationStatus } from '../types';

export const STALE_TIMEOUT_MINUTES = 30;
export const WARNING_TIMEOUT_MINUTES = 15;

export function validateSensorReading(
  reading: SensorReading | undefined,
  station: SensorStation | undefined,
  fieldId: string,
  dataSource: DataSourceMode = 'live'
): ValidatedSensorReading {
  const stationId = station?.id || reading?.stationId || 'unknown-station';

  // 1. Missing Reading Check
  if (!reading) {
    return {
      rawReading: null,
      soilMoisture: null,
      temperature: null,
      humidity: null,
      timestamp: null,
      stalenessMinutes: 9999,
      status: 'missing',
      isLiveReliable: false,
      validationErrors: ['No sensor readings have been received for this field.'],
      dataSource,
      fieldId,
      stationId,
    };
  }

  const errors: string[] = [];
  const now = Date.now();
  const readingTime = new Date(reading.timestamp).getTime();
  const stalenessMinutes = Math.max(0, Math.round((now - readingTime) / (1000 * 60)));

  // 2. Disconnected Station Check
  if (station && station.status === 'offline') {
    errors.push(`ESP32 sensor station ${station.name} is offline.`);
  }

  // 3. Electrical Bounds Check
  let isElectricalValid = reading.isValid;

  if (typeof reading.soilMoisture !== 'number' || isNaN(reading.soilMoisture)) {
    isElectricalValid = false;
    errors.push('Soil moisture value is NaN or missing.');
  } else if (reading.soilMoisture < 0 || reading.soilMoisture > 100) {
    isElectricalValid = false;
    errors.push(`Soil moisture ${reading.soilMoisture}% is outside valid physical range (0% - 100%). Check ADC calibration or wire short.`);
  }

  if (typeof reading.temperature !== 'number' || isNaN(reading.temperature)) {
    isElectricalValid = false;
    errors.push('Air temperature value is NaN.');
  } else if (reading.temperature < -10 || reading.temperature > 60) {
    isElectricalValid = false;
    errors.push(`Temperature ${reading.temperature}°C is outside plausible agricultural range (-10°C to 60°C).`);
  }

  if (typeof reading.humidity !== 'number' || isNaN(reading.humidity)) {
    isElectricalValid = false;
    errors.push('Air humidity value is NaN.');
  } else if (reading.humidity < 5 || reading.humidity > 100) {
    isElectricalValid = false;
    errors.push(`Air humidity ${reading.humidity}% RH is outside valid physical limits (5% to 100%).`);
  }

  // 4. Staleness / Outdated Check
  const isStale = stalenessMinutes > STALE_TIMEOUT_MINUTES;
  if (isStale) {
    errors.push(`Sensor reading is stale (last transmitted ${stalenessMinutes} minutes ago). Live recommendations suspended.`);
  }

  // Determine overall status
  let status: ReadingValidationStatus = 'fresh';
  if (!isElectricalValid) {
    status = 'invalid';
  } else if (station && station.status === 'offline') {
    status = 'disconnected';
  } else if (isStale) {
    status = 'stale';
  }

  const isLiveReliable = status === 'fresh' && isElectricalValid && !isStale;

  return {
    rawReading: reading,
    soilMoisture: isElectricalValid ? reading.soilMoisture : null,
    temperature: isElectricalValid ? reading.temperature : null,
    humidity: isElectricalValid ? reading.humidity : null,
    timestamp: reading.timestamp,
    stalenessMinutes,
    status,
    isLiveReliable,
    validationErrors: errors,
    dataSource,
    fieldId,
    stationId,
    battery: reading.battery ?? station?.battery,
    signalRssi: reading.signalRssi,
  };
}

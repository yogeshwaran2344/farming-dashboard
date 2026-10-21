import { ValidatedSensorReading, FieldZone, IrrigationRecommendation, Language, SensorReading } from '../types';

export function evaluateIrrigationRule(
  validatedReading: ValidatedSensorReading | undefined,
  field: FieldZone | undefined,
  lang: Language = 'en'
): IrrigationRecommendation {
  const isKn = lang === 'kn';

  // 1. Missing Reading Rule
  if (!validatedReading || validatedReading.status === 'missing' || validatedReading.soilMoisture === null) {
    return {
      status: 'missing',
      title: isKn ? "ದತ್ತಾಂಶ ಲಭ್ಯವಿಲ್ಲ" : "Missing Sensor Telemetry",
      action: isKn
        ? "ಸಂವೇದಕವನ್ನು ಸಂಪರ್ಕಿಸಿ: ಯಾವುದೇ ವಾಚನ ದಾಖಲಾಗಿಲ್ಲ."
        : "Connect or deploy ESP32 sensor station. No valid readings are recorded for this field.",
      reason: isKn
        ? "ಈ ಜಮೀನಿಗೆ ಯಾವುದೇ ಸಂವೇದಕ ವಾಚನಗಳು ಸಿಗುತ್ತಿಲ್ಲ. ನೀರಾವರಿ ಸಲಹೆ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ."
        : "Rule Engine requires fresh telemetry packets. Automated advice cannot be computed without physical probe readings.",
      timestamp: new Date().toISOString(),
      urgency: 'caution',
      ruleTriggered: 'RULE_DATA_MISSING',
      deficitOrSurplusPct: 0,
    };
  }

  // 2. Hardware / Sensor Fault Rule
  if (validatedReading.status === 'invalid') {
    const errorDetail = validatedReading.validationErrors[0] || 'Electrical bounds violated';
    return {
      status: 'fault',
      title: isKn ? "ದೋಷಯುಕ್ತ ಸಂವೇದಕ ವಾಚನ" : "Sensor Probe Hardware Fault",
      action: isKn
        ? "ಸಂವೇದಕ ಕೇಬಲ್ ಮತ್ತು ಪಿನ್ ಜೋಡಣೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ."
        : "Inspect physical probe cable, ADC calibration, and power rails. Do not use corrupted data for irrigation.",
      reason: isKn
        ? `ಸಂವೇದಕ ದೋಷ ಪತ್ತೆಯಾಗಿದೆ: ${errorDetail}`
        : `Deterministic validation rejected packet: ${errorDetail}`,
      timestamp: validatedReading.timestamp || new Date().toISOString(),
      urgency: 'caution',
      ruleTriggered: 'RULE_SENSOR_FAULT',
      deficitOrSurplusPct: 0,
    };
  }

  // 3. Stale / Disconnected Rule (Never display stale values as live decisions)
  if (validatedReading.status === 'stale' || validatedReading.status === 'disconnected') {
    const age = validatedReading.stalenessMinutes;
    return {
      status: 'stale',
      title: isKn ? "ಹಳೆಯ ದತ್ತಾಂಶ — ನೀರಾವರಿ ನಿರ್ಧಾರ ಸ್ಥಗಿತ" : "Stale Telemetry — Advice Suspended",
      action: isKn
        ? `ಕೊನೆಯ ವಾಚನವು ${age} ನಿಮಿಷಗಳ ಹಿಂದಿನದು. ಜಮೀನಿನಲ್ಲಿ ನೇರವಾಗಿ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ.`
        : `Last reading was received ${age} minutes ago (exceeds 30-min threshold). Perform manual soil check at 4-6 inch root depth before watering.`,
      reason: isKn
        ? "ESP32 ಸಾಧನದ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ಹಳೆಯ ದತ್ತಾಂಶದ ಆಧಾರದ ಮೇಲೆ ನೀರು ಹಾಯಿಸುವುದು ಬೆಳೆಗೆ ಹಾನಿಕರ."
        : "System safety rule: Outdated telemetry cannot guarantee current root zone saturation. Automatic watering recommendation is suspended until fresh packet arrives.",
      timestamp: validatedReading.timestamp || new Date().toISOString(),
      urgency: 'caution',
      ruleTriggered: 'RULE_STALE_TIMEOUT',
      deficitOrSurplusPct: 0,
    };
  }

  // 4. Validated Fresh Reading Rules
  const moisture = validatedReading.soilMoisture;
  const min = field?.targetMoistureMin ?? 40;
  const max = field?.targetMoistureMax ?? 70;
  const crop = field?.cropType || (isKn ? "ಬೆಳೆ" : "Crop");
  const stage = field?.cropStage || "Vegetative";
  const soil = field?.soilType || "Loamy Soil";
  const method = field?.irrigationMethod || "Drip";

  // Case A: Below Lower Threshold -> Moisture Deficit
  if (moisture < min) {
    const deficit = Math.round((min - moisture) * 10) / 10;
    return {
      status: 'low',
      title: isKn ? "ಕಡಿಮೆ ತೇವಾಂಶ — ನೀರಾವರಿ ಅಗತ್ಯವಿದೆ" : "Low Moisture — Irrigation Recommended",
      action: isKn
        ? `ಮಣ್ಣಿನ ತೇವಾಂಶ ${moisture}% ಇದೆ (ಕನಿಷ್ಠ ${min}% ಬೇಕು). ${crop} ಬೆಳೆಗೆ ${method} ಮೂಲಕ ನೀರು ಹಾಯಿಸಿ.`
        : `Soil moisture is ${moisture}%, which is ${deficit}% below the configured ${min}% threshold for ${crop} (${stage}). Irrigate using ${method}.`,
      reason: isKn
        ? `${crop} ಬೆಳೆಯು ${stage} ಹಂತದಲ್ಲಿದ್ದು, ${soil} ಮಣ್ಣಿನಲ್ಲಿ ಕನಿಷ್ಠ ${min}% ತೇವಾಂಶ ಅಗತ್ಯವಿದೆ. ತೇವಾಂಶದ ಕೊರತೆಯಿಂದ ಬೇರುಗಳ ಬೆಳವಣಿಗೆ ಕುಂಠಿತವಾಗಬಹುದು.`
        : `Configured Rule: Moisture Deficit Triggered. At the ${stage} stage in ${soil}, moisture depletion below ${min}% causes plant water stress and impedes nutrient transpiration.`,
      timestamp: validatedReading.timestamp || new Date().toISOString(),
      urgency: 'urgent',
      ruleTriggered: 'RULE_MOISTURE_DEFICIT',
      deficitOrSurplusPct: -deficit,
    };
  }

  // Case B: Above Upper Threshold -> Moisture Surplus
  if (moisture > max) {
    const surplus = Math.round((moisture - max) * 10) / 10;
    return {
      status: 'high',
      title: isKn ? "ಅಧಿಕ ತೇವಾಂಶ — ನೀರು ಹಾಯಿಸಬೇಡಿ" : "High Moisture — Hold Irrigation",
      action: isKn
        ? `ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ${moisture}% ಇದೆ (ಗರಿಷ್ಠ ಮಿತಿ ${max}%). ನೀರು ಹಾಯಿಸುವುದನ್ನು ತಡೆಹಿಡಿಯಿರಿ.`
        : `Soil moisture is ${moisture}%, which is ${surplus}% above the upper limit of ${max}%. Withhold all irrigation until natural drainage occurs.`,
      reason: isKn
        ? `ಮಣ್ಣು ಸಂಪೂರ್ಣವಾಗಿ ನೆನೆದಿದೆ. ಹೆಚ್ಚುವರಿ ನೀರು ಬೇರುಗಳಿಗೆ ಆಮ್ಲಜನಕ ಕೊರತೆ ಉಂಟುಮಾಡುತ್ತದೆ.`
        : `Configured Rule: Moisture Surplus Triggered. Excess water displaces air from soil pore spaces, creating hypoxic root conditions and elevating fungal disease risk.`,
      timestamp: validatedReading.timestamp || new Date().toISOString(),
      urgency: 'caution',
      ruleTriggered: 'RULE_MOISTURE_SURPLUS',
      deficitOrSurplusPct: surplus,
    };
  }

  // Case C: Within Target Band -> Optimal
  return {
    status: 'optimal',
    title: isKn ? "ಸೂಕ್ತ ತೇವಾಂಶ — ಉತ್ತಮ ಪರಿಸ್ಥಿತಿ" : "Optimal Moisture — In Target Range",
    action: isKn
      ? `ಮಣ್ಣಿನ ತೇವಾಂಶ ${moisture}% ಸೂಕ್ತ ಮಿತಿಯಲ್ಲಿದೆ (${min}% - ${max}%). ಈಗ ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ.`
      : `Soil moisture is at ${moisture}%, within the optimal ${min}% – ${max}% target band for ${crop}. Maintain current schedule.`,
    reason: isKn
      ? `ಬೇರುಗಳಿಗೆ ಅಗತ್ಯವಾದ ಗಾಳಿ ಮತ್ತು ನೀರಿನ ಸಮತೋಲನ ಅತ್ಯುತ್ತಮವಾಗಿದೆ.`
      : `Configured Rule: Optimal Band Maintained. Active root zone possesses ideal balance of capillary water retention and pore aeration.`,
    timestamp: validatedReading.timestamp || new Date().toISOString(),
    urgency: 'none',
    ruleTriggered: 'RULE_OPTIMAL_BAND',
    deficitOrSurplusPct: 0,
  };
}

export function calculateReadingStats(readings: SensorReading[]) {
  const validReadings = readings.filter(r => r.isValid && r.soilMoisture >= 0 && r.soilMoisture <= 100);
  if (validReadings.length === 0) {
    return {
      count: 0,
      avgMoisture: 0,
      minMoisture: 0,
      maxMoisture: 0,
      avgTemp: 0,
      minTemp: 0,
      maxTemp: 0,
      avgHumidity: 0,
    };
  }

  const moistures = validReadings.map(r => r.soilMoisture);
  const temps = validReadings.map(r => r.temperature);
  const hums = validReadings.map(r => r.humidity);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return {
    count: validReadings.length,
    avgMoisture: Math.round((sum(moistures) / moistures.length) * 10) / 10,
    minMoisture: Math.min(...moistures),
    maxMoisture: Math.max(...moistures),
    avgTemp: Math.round((sum(temps) / temps.length) * 10) / 10,
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgHumidity: Math.round((sum(hums) / hums.length) * 10) / 10,
  };
}

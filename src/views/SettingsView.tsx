import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Settings,
  Languages,
  Thermometer,
  Clock,
  Cpu,
  Copy,
  Check,
  Save,
  ShieldCheck,
  Code2,
  Radio,
  Sliders
} from 'lucide-react';
import { Language, TemperatureUnit } from '../types';

export const SettingsView: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    tempUnit,
    setTempUnit,
    hardwareSettings,
    updateHardwareSettings,
    stations,
  } = useFarm();

  const [endpoint, setEndpoint] = useState(hardwareSettings.apiEndpoint);
  const [apiKey, setApiKey] = useState(hardwareSettings.apiKey);
  const [intervalSec, setIntervalSec] = useState(hardwareSettings.pollIntervalSeconds);
  const [mode, setMode] = useState(hardwareSettings.mode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateHardwareSettings({
      apiEndpoint: endpoint,
      apiKey: apiKey,
      pollIntervalSeconds: Number(intervalSec),
      mode: mode,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const esp32SampleSketch = `// ==========================================
// FarmSense ESP32 Field Telemetry Firmware
// Hardware: ESP32-WROOM-32 + Capacitive Soil v1.2 + DHT22
// ==========================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

const char* ssid = "YOUR_FARM_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverEndpoint = "${endpoint}";
const char* deviceToken = "${apiKey}";

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_ADC_PIN 34 // Analog ADC1_CH6

DHT dht(DHTPIN, DHTTYPE);

// Calibrated ADC bounds for Capacitive Soil Moisture Sensor v1.2
const int AIR_VALUE = 3200;   // In dry air (0% moisture)
const int WATER_VALUE = 1400; // In water cup (100% moisture)

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected. IP: " + WiFi.localIP().toString());
}

void loop() {
  int rawAdc = analogRead(SOIL_ADC_PIN);
  float soilMoisture = map(rawAdc, AIR_VALUE, WATER_VALUE, 0, 100);
  soilMoisture = constrain(soilMoisture, 0.0, 100.0);

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (!isnan(temp) && !isnan(hum)) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverEndpoint);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Token", deviceToken);

      String payload = "{\\"stationId\\":\\"station-esp32-01\\",\\"soilMoisture\\":" + 
                        String(soilMoisture, 1) + 
                        ",\\"temperature\\":" + String(temp, 1) + 
                        ",\\"humidity\\":" + String(hum, 1) + "}";

      int httpResponseCode = http.POST(payload);
      Serial.printf("POST Result: %d\\n", httpResponseCode);
      http.end();
    }
  }
  delay(${intervalSec * 1000}); // Sleep until next transmission interval
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32SampleSketch);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Grid: Preferences & Hardware Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Languages className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {t.settings.generalSection}
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Language Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {t.settings.languageLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    language === 'en'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('kn')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    language === 'kn'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ಕನ್ನಡ (Kannada)
                </button>
              </div>
            </div>

            {/* Temp Unit Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {t.settings.tempUnitLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    tempUnit === 'C'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    tempUnit === 'F'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            {/* Reporting Interval */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.settings.reportingInterval}
              </label>
              <select
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
              >
                <option value={5}>5 Seconds (Fast Live Stream)</option>
                <option value={15}>15 Seconds (Field Diagnostics)</option>
                <option value={60}>1 Minute (Field Standard)</option>
                <option value={300}>5 Minutes (Battery Saver)</option>
                <option value={900}>15 Minutes (Solar Extended)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hardware Bridge Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {t.settings.hardwareSection}
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Hardware Telemetry Mode
              </label>
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-emerald-950 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-Time Live ESP32 Telemetry Engine (Active)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.settings.apiEndpointLabel}
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://192.168.1.100:8000/api/telemetry"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.settings.apiKeyLabel}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-sm transition"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Config Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t.settings.saveSettings}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ready-to-Flash ESP32 Firmware Snippet Viewer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {t.settings.esp32CodeTitle}
            </h2>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition self-start sm:self-auto"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.settings.copyCode}</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          When you are ready to plug in your ESP32 board, flash this sketch via Arduino IDE or PlatformIO. It directly connects to your dashboard API endpoint with calibrated analog capacitive soil mappings.
        </p>

        <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
          {esp32SampleSketch}
        </pre>
      </div>
    </div>
  );
};

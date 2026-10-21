# 🌾 FarmSense — Precision Agriculture & Farm Monitoring Dashboard

A responsive, farmer-friendly dashboard built from scratch for real-time farm monitoring, soil conditions, explainable irrigation guidance, sensor alerts, and decision support — built with **React, TypeScript, Tailwind CSS, Lucide Icons, and Recharts**.

---

## 🚀 Quick Start

To launch the dashboard locally:

```bash
# In the project root (c:\Users\yoges\Downloads\farmer-dashboard)
npm run dev
```

Then open your browser at the displayed local URL (typically `http://localhost:5173`).

---

## 📌 Features & Architecture Overview

The dashboard implements all **8 core sections** from the architectural plan:

### 1. Dashboard Overview
- **Header**: Live digital clock with date, active field switcher, ESP32 telemetry status pill, unread alerts bell counter, and instant English/Kannada language toggle.
- **4 Main Status Cards**:
  - **Soil Moisture**: Calibrated sensor reading (e.g. `42%`), dynamic state badge (Dry/Optimal/High), and target bounds.
  - **Air Temperature**: Ambient temperature with °C / °F toggle.
  - **Air Humidity**: Relative humidity (`% RH`).
  - **Device Status**: Station online/offline health, battery percentage, and time since last packet.
- **Prominent Irrigation Recommendation Panel**:
  - Direct rule-based assessment and clear recommended action.
  - Transparent reason explaining why water is needed or should be withheld.
  - Configured threshold display and reading timestamp.
- **Telemetry Trends Graph**: Interactive line chart with selectable intervals (`Last 1 Hour`, `Last 24 Hours`, `Last 7 Days`), min/max target guide lines, and toggleable series.
- **Recent Alerts Panel**: Shows active notifications with direct navigation.

### 2. Live Sensor Monitoring
- Multi-station telemetry cards (e.g. *ESP32 Node Alpha*, *Node Beta*, *Node Gamma*).
- Status states: **Online**, **Offline / Stale (>30m)**, and **Probe Hardware Fault**.
- Live telemetry stream toggle (5s ticker) and instant manual refresh.
- Detailed technical diagnostic breakdown with 24-hour moisture profile per sensor.

### 3. Irrigation Management
- **Soil Moisture Visualizer**: Target gauge bar illustrating where current moisture sits relative to lower and upper thresholds.
- **Crop-Specific Threshold Settings**: Configure min (trigger) and max (cutoff) limits per crop/field with instant local persistence.
- **Rule Guidance Matrix**: Transparent, deterministic logic table.
- **Pump Safety Controller**:
  - Manual ON/OFF with confirmation dialog.
  - Automatic 30-minute auto-cutoff safety timer.
  - Emergency Stop trigger.
  - Clear hardware bridge markings.

### 4. History and Reports
- Time period filters: **Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**.
- Strict mathematical aggregations (Min, Max, True Average) calculated solely from valid readings.
- Multi-series historical chart (Moisture, Temp, Humidity).
- Paginated table of recorded log entries with data integrity flags.
- **Download CSV Report**: Generates and downloads real CSV audit files.

### 5. Alerts and Notifications
- 4 Categories: **Moisture Alerts**, **Connectivity Timeouts**, **Sensor Faults**, and **Resolved History**.
- Actions to **Acknowledge**, **Resolve**, or **Clear All**.
- Severity indicators (*Critical*, *Warning*, *Info*).

### 6. Farm and Crop Management
- Interactive Field Zone cards showing crop, growth stage, soil type, acreage, irrigation method, and assigned station.
- Add New Field and Edit Field modal dialogs with input validation.
- Local storage persistence.

### 7. Farmer Assistant
- Plain-language diagnostic summaries in everyday farmer terms.
- Pre-irrigation safety checklist (root depth check, leak inspection, weather check).
- Interactive farm FAQ accordion for common field inquiries.

### 8. Settings & Hardware Bridge
- Bilingual language selector: **English** and **Kannada (ಕನ್ನಡ)**.
- Temperature units: **Celsius (°C)** and **Fahrenheit (°F)**.
- Sensor transmission interval selector (5s, 15s, 1m, 5m, 15m).
- ESP32 hardware bridge settings (REST API Endpoint, Device Token).
- Ready-to-flash C++ / Arduino firmware sketch with a "Copy Sketch" button.

---

## 🧪 Interactive Scenario Simulator

Click **"Scenario Sim"** in the top navigation bar to test how the dashboard responds to real-world agricultural conditions:
1. **Normal & Healthy (52%)**: Optimal root moisture.
2. **Low Moisture / Deficit (31%)**: Drought stress triggering irrigation advisory.
3. **Saturated Soil / Rain (84%)**: Holds irrigation to prevent root asphyxiation.
4. **Sensor Station Offline (48m Stale)**: Quarantines stale data and flags communication timeout.
5. **Sensor Probe Broken / Fault**: Out-of-bounds ADC voltage flagging probe hardware fault.

---

## 🔌 Connecting ESP32 Physical Sensors Later

When your hardware is ready:
1. Python FastAPI backend is already prepared in `server/app.py`:
   ```bash
   pip install -r server/requirements.txt
   python server/app.py
   ```
2. Flash the Arduino/C++ sketch provided in the **Settings** view to your ESP32 board.
3. Switch the dashboard from *Demo Mode* to *Live FastAPI / REST Backend* in **Settings**.

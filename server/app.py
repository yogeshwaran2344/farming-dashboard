"""
FarmSense - FastAPI + SQLite Real-Time Telemetry Backend
Strictly Real-Time Ingestion with Automatic Telemetry Deduplication
"""

import sqlite3
import datetime
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Locate database and frontend static build directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "farmsense.db")
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "dist"))

app = FastAPI(
    title="FarmSense Real-Time Telemetry API",
    description="Deterministic ESP32 farm telemetry ingestion with duplicate-prevention and real-time streaming",
    version="2.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Telemetry readings table with UNIQUE constraint on (station_id, timestamp) for duplicate elimination
    c.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            station_id TEXT NOT NULL,
            field_id TEXT NOT NULL,
            soil_moisture REAL NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            is_valid INTEGER DEFAULT 1,
            battery REAL DEFAULT 90.0,
            signal_rssi INTEGER DEFAULT -65,
            UNIQUE(station_id, timestamp)
        )
    """)
    # Fields table
    c.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            crop_type TEXT NOT NULL,
            crop_stage TEXT,
            soil_type TEXT,
            target_moisture_min REAL DEFAULT 40.0,
            target_moisture_max REAL DEFAULT 70.0,
            assigned_station_id TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

# Request schemas
class TelemetryPayload(BaseModel):
    stationId: str
    fieldId: Optional[str] = "field-1"
    soilMoisture: float = Field(..., ge=0.0, le=100.0)
    temperature: float
    humidity: float = Field(..., ge=0.0, le=100.0)
    battery: Optional[float] = 90.0
    signalRssi: Optional[int] = -65
    timestamp: Optional[str] = None

@app.get("/")
def read_root():
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "service": "FarmSense Real-Time Agriculture Backend",
        "status": "online",
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/health")
def get_health():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM sensor_readings")
    total_packets = c.fetchone()[0]
    c.execute("SELECT timestamp, station_id, field_id, soil_moisture FROM sensor_readings ORDER BY id DESC LIMIT 1")
    latest_row = c.fetchone()
    conn.close()

    latest_info = None
    if latest_row:
        latest_info = {
            "timestamp": latest_row[0],
            "stationId": latest_row[1],
            "fieldId": latest_row[2],
            "soilMoisture": latest_row[3],
        }

    return {
        "status": "healthy",
        "mode": "real_time_live",
        "totalPacketsRecorded": total_packets,
        "latestReading": latest_info,
        "currentTime": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.post("/api/telemetry")
@app.post("/api/telemetry/transmit")
def ingest_telemetry(payload: TelemetryPayload, x_device_token: Optional[str] = Header(None)):
    """
    Ingests live telemetry packet from ESP32 or test transmitter.
    Prevents duplicate entries via UNIQUE(station_id, timestamp).
    """
    now = payload.timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Strict electrical bound checks for real sensors
    is_valid = 1 if (0.0 <= payload.soilMoisture <= 100.0 and -20.0 <= payload.temperature <= 60.0 and 5.0 <= payload.humidity <= 100.0) else 0

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        INSERT OR IGNORE INTO sensor_readings 
        (timestamp, station_id, field_id, soil_moisture, temperature, humidity, is_valid, battery, signal_rssi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        now,
        payload.stationId,
        payload.fieldId,
        payload.soilMoisture,
        payload.temperature,
        payload.humidity,
        is_valid,
        payload.battery,
        payload.signalRssi
    ))
    inserted_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "id": inserted_id,
        "recordedAt": now,
        "isValid": bool(is_valid),
        "stationId": payload.stationId,
        "fieldId": payload.fieldId,
        "soilMoisture": payload.soilMoisture,
        "temperature": payload.temperature,
        "humidity": payload.humidity,
    }

@app.get("/api/readings/latest")
def get_latest_readings(field_id: Optional[str] = None):
    """
    Returns the latest non-duplicated reading for each field/station,
    or the latest readings overall.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if field_id:
        c.execute("""
            SELECT * FROM sensor_readings 
            WHERE field_id = ? 
            ORDER BY id DESC LIMIT 1
        """, (field_id,))
        rows = c.fetchall()
    else:
        # Get the single latest reading per station/field
        c.execute("""
            SELECT r.* FROM sensor_readings r
            INNER JOIN (
                SELECT station_id, MAX(id) as max_id
                FROM sensor_readings
                GROUP BY station_id
            ) latest ON r.id = latest.max_id
            ORDER BY r.id DESC
        """)
        rows = c.fetchall()

    conn.close()
    
    # Format to frontend camelCase model
    results = []
    for r in rows:
        results.append({
            "id": f"read-{r['id']}",
            "timestamp": r["timestamp"],
            "stationId": r["station_id"],
            "fieldId": r["field_id"],
            "soilMoisture": r["soil_moisture"],
            "temperature": r["temperature"],
            "humidity": r["humidity"],
            "isValid": bool(r["is_valid"]),
            "battery": r["battery"],
            "signalRssi": r["signal_rssi"],
        })
    return results

@app.get("/api/readings/history")
def get_reading_history(
    field_id: Optional[str] = None, 
    limit: int = Query(100, ge=1, le=500)
):
    """
    Returns chronological historical readings without duplicates.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if field_id:
        c.execute("""
            SELECT * FROM sensor_readings 
            WHERE field_id = ? 
            ORDER BY id ASC 
            LIMIT ?
        """, (field_id, limit))
    else:
        c.execute("""
            SELECT * FROM sensor_readings 
            ORDER BY id ASC 
            LIMIT ?
        """, (limit,))

    rows = c.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": f"read-{r['id']}",
            "timestamp": r["timestamp"],
            "stationId": r["station_id"],
            "fieldId": r["field_id"],
            "soilMoisture": r["soil_moisture"],
            "temperature": r["temperature"],
            "humidity": r["humidity"],
            "isValid": bool(r["is_valid"]),
            "battery": r["battery"],
            "signalRssi": r["signal_rssi"],
        })
    return results

# Serve static frontend assets and SPA routes if dist directory is present
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Do not intercept API or documentation routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)

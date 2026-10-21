"""
FarmSense - ESP32 Hardware Packet Transmitter Utility
Sends simulated or bench-test telemetry packets to the running FastAPI server.

Usage:
    python server/transmit_packet.py
    python server/transmit_packet.py --moisture 38.5 --temp 31.0 --field field-1
"""

import sys
import time
import argparse
import urllib.request
import json
import datetime

DEFAULT_SERVER = "http://127.0.0.1:8000/api/telemetry"

def send_packet(station_id, field_id, moisture, temp, humidity, battery=92.0, rssi=-64, url=DEFAULT_SERVER):
    payload = {
        "stationId": station_id,
        "fieldId": field_id,
        "soilMoisture": moisture,
        "temperature": temp,
        "humidity": humidity,
        "battery": battery,
        "signalRssi": rssi,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(f"[LIVE TX] Sent -> Field: {field_id} | Moisture: {moisture}% | Temp: {temp}C | Status: {result.get('status')}")
            return result
    except Exception as e:
        print(f"[ERR] Failed to transmit: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transmit real-time telemetry packet to FarmSense")
    parser.add_argument("--station", default="station-esp32-01", help="ESP32 Station ID")
    parser.add_argument("--field", default="field-1", help="Target Field ID")
    parser.add_argument("--moisture", type=float, default=43.5, help="Soil Moisture percentage (0-100)")
    parser.add_argument("--temp", type=float, default=29.0, help="Air Temperature in Celsius")
    parser.add_argument("--humidity", type=float, default=62.0, help="Relative Humidity (0-100)")
    parser.add_argument("--loop", action="store_true", help="Continuously send periodic packets every 5 seconds")
    
    args = parser.parse_args()

    if args.loop:
        print("[LOOP] Starting continuous telemetry transmitter (Ctrl+C to stop)...")
        while True:
            send_packet(args.station, args.field, args.moisture, args.temp, args.humidity)
            time.sleep(5)
    else:
        send_packet(args.station, args.field, args.moisture, args.temp, args.humidity)

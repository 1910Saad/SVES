/**
 * SVES IoT Simulator
 * Simulates BLE beacons, environmental sensors, and camera feeds
 * Sends data to the backend via HTTP API
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

class IoTSimulator {
  constructor() {
    this.sensors = this.initializeSensors();
    this.beacons = this.initializeBeacons();
    this.interval = null;
  }

  initializeSensors() {
    return [
      { id: 'iot_temp_001', type: 'temperature', zone: 'North Gate', min: 18, max: 35, unit: '°C' },
      { id: 'iot_temp_002', type: 'temperature', zone: 'South Gate', min: 18, max: 35, unit: '°C' },
      { id: 'iot_hum_001', type: 'humidity', zone: 'Main Corridor', min: 30, max: 80, unit: '%' },
      { id: 'iot_noise_001', type: 'noise', zone: 'Section A', min: 40, max: 110, unit: 'dB' },
      { id: 'iot_noise_002', type: 'noise', zone: 'Section B', min: 40, max: 110, unit: 'dB' },
      { id: 'iot_air_001', type: 'air_quality', zone: 'VIP Lounge', min: 20, max: 100, unit: 'AQI' },
      { id: 'iot_occ_001', type: 'occupancy', zone: 'North Gate', min: 0, max: 5000, unit: 'people' },
      { id: 'iot_occ_002', type: 'occupancy', zone: 'Food Court N', min: 0, max: 3000, unit: 'people' },
    ];
  }

  initializeBeacons() {
    return [
      { id: 'ble_001', zone: 'North Gate', x: 50, y: 5, rssi: -65 },
      { id: 'ble_002', zone: 'South Gate', x: 50, y: 90, rssi: -70 },
      { id: 'ble_003', zone: 'Section A', x: 30, y: 30, rssi: -60 },
      { id: 'ble_004', zone: 'Section B', x: 70, y: 30, rssi: -62 },
      { id: 'ble_005', zone: 'VIP Lounge', x: 50, y: 50, rssi: -55 },
      { id: 'ble_006', zone: 'Food Court N', x: 25, y: 12, rssi: -68 },
    ];
  }

  generateSensorReading(sensor) {
    const range = sensor.max - sensor.min;
    const base = (sensor.min + sensor.max) / 2;
    const noise = (Math.random() - 0.5) * range * 0.4;
    const timeFactor = Math.sin(Date.now() / 30000) * range * 0.15;
    return Math.max(sensor.min, Math.min(sensor.max, base + noise + timeFactor));
  }

  async sendSensorData() {
    for (const sensor of this.sensors) {
      const reading = {
        sensorId: sensor.id,
        type: sensor.type,
        zone: sensor.zone,
        value: Math.round(this.generateSensorReading(sensor) * 10) / 10,
        unit: sensor.unit,
        timestamp: new Date().toISOString(),
        battery: Math.round(85 + Math.random() * 15),
        status: Math.random() > 0.02 ? 'online' : 'error'
      };

      try {
        await fetch(`${BACKEND_URL}/api/sensors/${sensor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reading)
        });
      } catch (err) {
        // Silently continue if backend unavailable
      }
    }
  }

  async sendBeaconData() {
    const beaconData = this.beacons.map(b => ({
      ...b,
      rssi: b.rssi + Math.floor(Math.random() * 10 - 5),
      timestamp: new Date().toISOString(),
      nearbyDevices: Math.floor(Math.random() * 50)
    }));

    try {
      // Beacons can be used for indoor positioning
      console.log(`📡 ${beaconData.length} BLE beacons transmitting`);
    } catch (err) {
      // Silently continue
    }
  }

  start(intervalMs = 5000) {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║  📡 SVES IoT Simulator                  ║
    ║  Simulating ${this.sensors.length} sensors, ${this.beacons.length} BLE beacons      ║
    ║  Interval: ${intervalMs / 1000}s                          ║
    ║  Backend: ${BACKEND_URL}         ║
    ╚══════════════════════════════════════════╝
    `);

    this.interval = setInterval(async () => {
      await this.sendSensorData();
      await this.sendBeaconData();
      
      const timestamp = new Date().toLocaleTimeString();
      process.stdout.write(`\r📡 [${timestamp}] Transmitting sensor data...`);
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('\n🛑 IoT Simulator stopped');
    }
  }
}

// Run simulator
const simulator = new IoTSimulator();
simulator.start(5000);

// Graceful shutdown
process.on('SIGINT', () => {
  simulator.stop();
  process.exit(0);
});

const express = require('express');
const router = express.Router();

// In-memory sensor data (updated by simulation)
let sensorsData = {
  'sen_temp_01': { sensorId: 'sen_temp_01', name: 'Temp Sensor - North', type: 'temperature', zone: 'North Gate', value: 22, unit: '°C', status: 'online', battery: 95, lastReading: new Date(), coordinates: { x: 50, y: 8 } },
  'sen_temp_02': { sensorId: 'sen_temp_02', name: 'Temp Sensor - South', type: 'temperature', zone: 'South Gate', value: 23, unit: '°C', status: 'online', battery: 88, lastReading: new Date(), coordinates: { x: 50, y: 88 } },
  'sen_hum_01': { sensorId: 'sen_hum_01', name: 'Humidity - Main Hall', type: 'humidity', zone: 'Main Corridor', value: 45, unit: '%', status: 'online', battery: 92, lastReading: new Date(), coordinates: { x: 50, y: 50 } },
  'sen_noise_01': { sensorId: 'sen_noise_01', name: 'Noise - Section A', type: 'noise', zone: 'Section A - Lower Bowl', value: 72, unit: 'dB', status: 'online', battery: 78, lastReading: new Date(), coordinates: { x: 30, y: 30 } },
  'sen_noise_02': { sensorId: 'sen_noise_02', name: 'Noise - Section B', type: 'noise', zone: 'Section B - Lower Bowl', value: 68, unit: 'dB', status: 'online', battery: 85, lastReading: new Date(), coordinates: { x: 65, y: 30 } },
  'sen_occ_01': { sensorId: 'sen_occ_01', name: 'Occupancy - North Gate', type: 'occupancy', zone: 'North Gate', value: 0, unit: 'people', status: 'online', battery: 97, lastReading: new Date(), coordinates: { x: 55, y: 6 } },
  'sen_occ_02': { sensorId: 'sen_occ_02', name: 'Occupancy - South Gate', type: 'occupancy', zone: 'South Gate', value: 0, unit: 'people', status: 'online', battery: 91, lastReading: new Date(), coordinates: { x: 55, y: 89 } },
  'sen_air_01': { sensorId: 'sen_air_01', name: 'Air Quality - Indoor', type: 'air_quality', zone: 'Main Corridor', value: 42, unit: 'AQI', status: 'online', battery: 82, lastReading: new Date(), coordinates: { x: 45, y: 48 } },
  'sen_mot_01': { sensorId: 'sen_mot_01', name: 'Motion - Corridor', type: 'motion', zone: 'Main Corridor', value: 0, unit: 'events/min', status: 'online', battery: 90, lastReading: new Date(), coordinates: { x: 40, y: 50 } },
  'sen_cam_01': { sensorId: 'sen_cam_01', name: 'Camera - Overview', type: 'camera', zone: 'Main Corridor', value: 0, unit: 'density%', status: 'online', battery: 100, lastReading: new Date(), coordinates: { x: 50, y: 45 } }
};

// Get all sensors
router.get('/', (req, res) => {
  const { type, zone } = req.query;
  let sensors = Object.values(sensorsData);
  if (type) sensors = sensors.filter(s => s.type === type);
  if (zone) sensors = sensors.filter(s => s.zone === zone);
  res.json(sensors);
});

// Get sensor by ID
router.get('/:id', (req, res) => {
  const sensor = sensorsData[req.params.id];
  if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
  res.json(sensor);
});

// Export for simulation
router.updateSensor = (id, data) => {
  if (sensorsData[id]) {
    sensorsData[id] = { ...sensorsData[id], ...data, lastReading: new Date() };
  }
};

router.getSensors = () => sensorsData;

module.exports = router;

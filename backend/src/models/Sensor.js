const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['temperature', 'humidity', 'noise', 'occupancy', 'air_quality', 'motion', 'camera'], required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  zone: { type: String, required: true },
  value: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline', 'error', 'maintenance'], default: 'online' },
  battery: { type: Number, default: 100 },
  lastReading: { type: Date, default: Date.now },
  coordinates: {
    x: { type: Number },
    y: { type: Number }
  },
  thresholds: {
    min: { type: Number },
    max: { type: Number }
  },
  readings: [{
    timestamp: { type: Date, default: Date.now },
    value: { type: Number }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Sensor', sensorSchema);

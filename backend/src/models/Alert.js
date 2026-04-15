const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['emergency', 'warning', 'info', 'success', 'crowd', 'weather', 'security'], required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  zone: { type: String },
  isActive: { type: Boolean, default: true },
  acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);

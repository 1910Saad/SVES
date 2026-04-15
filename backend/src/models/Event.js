const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['football', 'cricket', 'basketball', 'concert', 'conference', 'other'], required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  venueName: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  expectedAttendance: { type: Number, required: true },
  currentAttendance: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' },
  ticketPrice: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  tags: [{ type: String }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  crowdDensity: {
    overall: { type: Number, default: 0 },
    zones: { type: Map, of: Number, default: {} }
  },
  weather: {
    temperature: { type: Number },
    condition: { type: String },
    humidity: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);

const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['entrance', 'seating', 'concession', 'restroom', 'vip', 'parking', 'stage', 'emergency_exit', 'corridor', 'merchandise'], required: true },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  color: { type: String, default: '#3B82F6' },
  floor: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
});

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  totalCapacity: { type: Number, required: true },
  currentAttendance: { type: Number, default: 0 },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  zones: [zoneSchema],
  amenities: [{ type: String }],
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['active', 'maintenance', 'closed'], default: 'active' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);

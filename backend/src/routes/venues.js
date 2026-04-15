const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const { authMiddleware } = require('../middleware/auth');

// Default venue data for demo
const defaultVenue = {
  _id: 'venue_001',
  name: 'MetLife Stadium',
  description: 'Premier multi-purpose stadium with 82,500 capacity',
  address: '1 MetLife Stadium Dr',
  city: 'East Rutherford',
  country: 'USA',
  totalCapacity: 82500,
  currentAttendance: 0,
  coordinates: { lat: 40.8135, lng: -74.0745 },
  status: 'active',
  amenities: ['WiFi', 'Parking', 'Food Court', 'First Aid', 'ATM', 'Merchandise'],
  zones: [
    { _id: 'z1', name: 'North Gate', type: 'entrance', capacity: 5000, currentOccupancy: 0, coordinates: { x: 50, y: 5, width: 20, height: 8 }, color: '#22C55E', floor: 1 },
    { _id: 'z2', name: 'South Gate', type: 'entrance', capacity: 5000, currentOccupancy: 0, coordinates: { x: 50, y: 87, width: 20, height: 8 }, color: '#22C55E', floor: 1 },
    { _id: 'z3', name: 'East Gate', type: 'entrance', capacity: 3000, currentOccupancy: 0, coordinates: { x: 92, y: 45, width: 8, height: 15 }, color: '#22C55E', floor: 1 },
    { _id: 'z4', name: 'West Gate', type: 'entrance', capacity: 3000, currentOccupancy: 0, coordinates: { x: 0, y: 45, width: 8, height: 15 }, color: '#22C55E', floor: 1 },
    { _id: 'z5', name: 'Section A - Lower Bowl', type: 'seating', capacity: 12000, currentOccupancy: 0, coordinates: { x: 20, y: 20, width: 25, height: 25 }, color: '#3B82F6', floor: 1 },
    { _id: 'z6', name: 'Section B - Lower Bowl', type: 'seating', capacity: 12000, currentOccupancy: 0, coordinates: { x: 55, y: 20, width: 25, height: 25 }, color: '#3B82F6', floor: 1 },
    { _id: 'z7', name: 'Section C - Upper Deck', type: 'seating', capacity: 15000, currentOccupancy: 0, coordinates: { x: 20, y: 55, width: 25, height: 25 }, color: '#6366F1', floor: 2 },
    { _id: 'z8', name: 'Section D - Upper Deck', type: 'seating', capacity: 15000, currentOccupancy: 0, coordinates: { x: 55, y: 55, width: 25, height: 25 }, color: '#6366F1', floor: 2 },
    { _id: 'z9', name: 'VIP Lounge', type: 'vip', capacity: 2000, currentOccupancy: 0, coordinates: { x: 38, y: 38, width: 24, height: 24 }, color: '#F59E0B', floor: 2 },
    { _id: 'z10', name: 'Food Court North', type: 'concession', capacity: 3000, currentOccupancy: 0, coordinates: { x: 15, y: 12, width: 18, height: 6 }, color: '#EF4444', floor: 1 },
    { _id: 'z11', name: 'Food Court South', type: 'concession', capacity: 3000, currentOccupancy: 0, coordinates: { x: 67, y: 82, width: 18, height: 6 }, color: '#EF4444', floor: 1 },
    { _id: 'z12', name: 'Restrooms West', type: 'restroom', capacity: 500, currentOccupancy: 0, coordinates: { x: 8, y: 30, width: 6, height: 10 }, color: '#8B5CF6', floor: 1 },
    { _id: 'z13', name: 'Restrooms East', type: 'restroom', capacity: 500, currentOccupancy: 0, coordinates: { x: 86, y: 60, width: 6, height: 10 }, color: '#8B5CF6', floor: 1 },
    { _id: 'z14', name: 'Merchandise Store', type: 'merchandise', capacity: 1000, currentOccupancy: 0, coordinates: { x: 67, y: 12, width: 15, height: 6 }, color: '#EC4899', floor: 1 },
    { _id: 'z15', name: 'Emergency Exit A', type: 'emergency_exit', capacity: 2000, currentOccupancy: 0, coordinates: { x: 10, y: 80, width: 8, height: 6 }, color: '#DC2626', floor: 1 },
    { _id: 'z16', name: 'Parking Lot', type: 'parking', capacity: 15000, currentOccupancy: 0, coordinates: { x: 0, y: 0, width: 100, height: 3 }, color: '#6B7280', floor: 0 },
    { _id: 'z17', name: 'Main Corridor', type: 'corridor', capacity: 8000, currentOccupancy: 0, coordinates: { x: 15, y: 45, width: 70, height: 10 }, color: '#94A3B8', floor: 1 }
  ]
};

// Get all venues
router.get('/', async (req, res) => {
  try {
    const venues = await Venue.find();
    if (venues.length === 0) {
      return res.json([defaultVenue]);
    }
    res.json(venues);
  } catch (error) {
    res.json([defaultVenue]);
  }
});

// Get venue by ID
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.json(defaultVenue);
    }
    res.json(venue);
  } catch (error) {
    res.json(defaultVenue);
  }
});

// Create venue
router.post('/', authMiddleware, async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update venue zone occupancy
router.put('/:id/zones/:zoneId', async (req, res) => {
  try {
    const { currentOccupancy } = req.body;
    const venue = await Venue.findById(req.params.id);
    if (venue) {
      const zone = venue.zones.id(req.params.zoneId);
      if (zone) {
        zone.currentOccupancy = currentOccupancy;
        await venue.save();
        return res.json(venue);
      }
    }
    res.json(defaultVenue);
  } catch (error) {
    res.json(defaultVenue);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');

const defaultEvents = [
  {
    _id: 'evt_001',
    name: 'NFL Championship Finals',
    description: 'The ultimate showdown between the top two teams',
    type: 'football',
    venueName: 'MetLife Stadium',
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    expectedAttendance: 75000,
    currentAttendance: 0,
    status: 'live',
    ticketPrice: 250,
    tags: ['NFL', 'Championship', 'Finals'],
    crowdDensity: { overall: 0, zones: {} },
    weather: { temperature: 22, condition: 'Clear', humidity: 45 }
  },
  {
    _id: 'evt_002',
    name: 'Premier League: City vs United',
    description: 'Manchester Derby - Premier League matchday',
    type: 'football',
    venueName: 'MetLife Stadium',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 28 * 60 * 60 * 1000),
    expectedAttendance: 68000,
    currentAttendance: 0,
    status: 'upcoming',
    ticketPrice: 180,
    tags: ['Premier League', 'Derby'],
    crowdDensity: { overall: 0, zones: {} },
    weather: { temperature: 18, condition: 'Cloudy', humidity: 60 }
  },
  {
    _id: 'evt_003',
    name: 'World Cup Cricket Semi-Final',
    description: 'ICC World Cup semi-final clash',
    type: 'cricket',
    venueName: 'MetLife Stadium',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 56 * 60 * 60 * 1000),
    expectedAttendance: 72000,
    currentAttendance: 0,
    status: 'upcoming',
    ticketPrice: 150,
    tags: ['Cricket', 'World Cup', 'Semi-Final'],
    crowdDensity: { overall: 0, zones: {} },
    weather: { temperature: 28, condition: 'Sunny', humidity: 35 }
  }
];

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('venue').sort({ startTime: -1 });
    if (events.length === 0) return res.json(defaultEvents);
    res.json(events);
  } catch (error) {
    res.json(defaultEvents);
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('venue');
    if (!event) {
      const demo = defaultEvents.find(e => e._id === req.params.id) || defaultEvents[0];
      return res.json(demo);
    }
    res.json(event);
  } catch (error) {
    const demo = defaultEvents.find(e => e._id === req.params.id) || defaultEvents[0];
    res.json(demo);
  }
});

// Create event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user.id });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

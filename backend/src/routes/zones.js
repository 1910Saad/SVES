const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// In-memory zone data (updated by simulation)
let zonesData = {};

// Get all zones with real-time data
router.get('/', (req, res) => {
  res.json(Object.values(zonesData));
});

// Get specific zone
router.get('/:id', (req, res) => {
  const zone = zonesData[req.params.id];
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  res.json(zone);
});

// Update zone (from simulation or admin)
router.put('/:id', (req, res) => {
  zonesData[req.params.id] = { ...zonesData[req.params.id], ...req.body };
  res.json(zonesData[req.params.id]);
});

// Export for simulation engine to update
router.updateZone = (id, data) => {
  zonesData[id] = { ...zonesData[id], ...data };
};

router.getZones = () => zonesData;

module.exports = router;

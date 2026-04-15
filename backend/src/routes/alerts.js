const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// In-memory alerts
let alertsData = [
  {
    _id: 'alert_001',
    title: 'System Online',
    message: 'SVES monitoring system is fully operational',
    type: 'info',
    severity: 'low',
    zone: 'All Zones',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Get all alerts
router.get('/', (req, res) => {
  const active = req.query.active === 'true';
  const alerts = active ? alertsData.filter(a => a.isActive) : alertsData;
  res.json(alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Create alert
router.post('/', (req, res) => {
  const alert = {
    _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...req.body,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  alertsData.unshift(alert);
  
  // Broadcast via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.emit('new-alert', alert);
  }
  
  res.status(201).json(alert);
});

// Acknowledge alert
router.put('/:id/acknowledge', authMiddleware, (req, res) => {
  const alert = alertsData.find(a => a._id === req.params.id);
  if (alert) {
    alert.isActive = false;
    alert.acknowledgedAt = new Date().toISOString();
  }
  res.json(alert);
});

// Delete alert
router.delete('/:id', (req, res) => {
  alertsData = alertsData.filter(a => a._id !== req.params.id);
  res.json({ success: true });
});

// Export for simulation
router.addAlert = (alert) => {
  const newAlert = {
    _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...alert,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  alertsData.unshift(newAlert);
  if (alertsData.length > 100) alertsData = alertsData.slice(0, 100);
  return newAlert;
};

router.getAlerts = () => alertsData;

module.exports = router;

const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const { authMiddleware } = require('../middleware/auth');

// In-memory queue data (updated by simulation)
let queuesData = {
  'q1': { _id: 'q1', name: 'Food Court North - Main', type: 'concession', zone: 'Food Court North', currentLength: 0, maxLength: 80, estimatedWaitTime: 0, averageServiceTime: 3, status: 'open', servers: 4, coordinates: { x: 20, y: 14 } },
  'q2': { _id: 'q2', name: 'Food Court South - Main', type: 'concession', zone: 'Food Court South', currentLength: 0, maxLength: 80, estimatedWaitTime: 0, averageServiceTime: 3, status: 'open', servers: 4, coordinates: { x: 72, y: 84 } },
  'q3': { _id: 'q3', name: 'North Gate Entry', type: 'entry', zone: 'North Gate', currentLength: 0, maxLength: 200, estimatedWaitTime: 0, averageServiceTime: 0.5, status: 'open', servers: 8, coordinates: { x: 55, y: 7 } },
  'q4': { _id: 'q4', name: 'South Gate Entry', type: 'entry', zone: 'South Gate', currentLength: 0, maxLength: 200, estimatedWaitTime: 0, averageServiceTime: 0.5, status: 'open', servers: 8, coordinates: { x: 55, y: 89 } },
  'q5': { _id: 'q5', name: 'Restrooms West', type: 'restroom', zone: 'Restrooms West', currentLength: 0, maxLength: 40, estimatedWaitTime: 0, averageServiceTime: 2, status: 'open', servers: 10, coordinates: { x: 10, y: 33 } },
  'q6': { _id: 'q6', name: 'Restrooms East', type: 'restroom', zone: 'Restrooms East', currentLength: 0, maxLength: 40, estimatedWaitTime: 0, averageServiceTime: 2, status: 'open', servers: 10, coordinates: { x: 88, y: 63 } },
  'q7': { _id: 'q7', name: 'Merchandise Store', type: 'merchandise', zone: 'Merchandise Store', currentLength: 0, maxLength: 50, estimatedWaitTime: 0, averageServiceTime: 4, status: 'open', servers: 3, coordinates: { x: 72, y: 14 } },
  'q8': { _id: 'q8', name: 'VIP Entrance', type: 'vip', zone: 'VIP Lounge', currentLength: 0, maxLength: 20, estimatedWaitTime: 0, averageServiceTime: 1, status: 'open', servers: 2, coordinates: { x: 48, y: 40 } }
};

// Get all queues
router.get('/', (req, res) => {
  res.json(Object.values(queuesData));
});

// Get queue by ID
router.get('/:id', (req, res) => {
  const queue = queuesData[req.params.id];
  if (!queue) return res.status(404).json({ error: 'Queue not found' });
  res.json(queue);
});

// Update queue
router.put('/:id', (req, res) => {
  if (queuesData[req.params.id]) {
    queuesData[req.params.id] = { ...queuesData[req.params.id], ...req.body };
    
    // Auto-calculate wait time
    const q = queuesData[req.params.id];
    q.estimatedWaitTime = Math.ceil((q.currentLength * q.averageServiceTime) / Math.max(q.servers, 1));
    
    if (q.currentLength >= q.maxLength * 0.9) q.status = 'full';
    else if (q.currentLength >= q.maxLength * 0.6) q.status = 'busy';
    else q.status = 'open';
  }
  res.json(queuesData[req.params.id]);
});

// Export for simulation
router.updateQueue = (id, data) => {
  if (queuesData[id]) {
    queuesData[id] = { ...queuesData[id], ...data };
    const q = queuesData[id];
    q.estimatedWaitTime = Math.ceil((q.currentLength * q.averageServiceTime) / Math.max(q.servers, 1));
    if (q.currentLength >= q.maxLength * 0.9) q.status = 'full';
    else if (q.currentLength >= q.maxLength * 0.6) q.status = 'busy';
    else q.status = 'open';
  }
};

router.getQueues = () => queuesData;

module.exports = router;

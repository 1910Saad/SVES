const express = require('express');
const router = express.Router();

// Analytics data store (updated by simulation)
let analyticsData = {
  totalAttendees: 0,
  peakAttendance: 0,
  averageDwellTime: 0,
  crowdDensity: 0,
  satisfactionScore: 4.2,
  incidentCount: 0,
  revenueEstimate: 0,
  hourlyAttendance: [],
  zoneDensityHistory: [],
  queueWaitHistory: [],
  flowPatterns: [],
  heatmapData: [],
  predictions: {
    nextHourAttendance: 0,
    peakTime: '15:30',
    crowdDirection: 'north',
    exitEstimate: '18:00'
  }
};

// Get dashboard analytics
router.get('/dashboard', (req, res) => {
  res.json(analyticsData);
});

// Get crowd flow data
router.get('/crowd-flow', (req, res) => {
  res.json({
    patterns: analyticsData.flowPatterns,
    heatmap: analyticsData.heatmapData,
    predictions: analyticsData.predictions
  });
});

// Get queue analytics
router.get('/queues', (req, res) => {
  res.json({
    waitHistory: analyticsData.queueWaitHistory,
    currentStats: {
      averageWait: analyticsData.averageDwellTime,
      longestQueue: 'Food Court North',
      shortestQueue: 'VIP Entrance'
    }
  });
});

// Get zone analytics
router.get('/zones', (req, res) => {
  res.json({
    densityHistory: analyticsData.zoneDensityHistory,
    currentDensity: analyticsData.crowdDensity
  });
});

// Get prediction data
router.get('/predictions', (req, res) => {
  res.json(analyticsData.predictions);
});

// Export for simulation
router.updateAnalytics = (data) => {
  analyticsData = { ...analyticsData, ...data };
};

router.getAnalytics = () => analyticsData;

module.exports = router;

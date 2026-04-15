/**
 * SVES Simulation Engine
 * Generates realistic real-time venue data for demonstration
 * Simulates crowd movement, queue dynamics, sensor readings, and alerts
 */

const queuesRoute = require('../routes/queues');
const sensorsRoute = require('../routes/sensors');
const analyticsRoute = require('../routes/analytics');
const alertsRoute = require('../routes/alerts');

// Simulation state
let simulationTime = 0; // minutes since event start
let totalAttendees = 0;
let peakAttendance = 0;
const MAX_CAPACITY = 82500;
const EVENT_DURATION = 240; // 4 hours in minutes

// Zone occupancy tracking
const zoneOccupancy = {
  'z1': 0, 'z2': 0, 'z3': 0, 'z4': 0,
  'z5': 0, 'z6': 0, 'z7': 0, 'z8': 0,
  'z9': 0, 'z10': 0, 'z11': 0, 'z12': 0,
  'z13': 0, 'z14': 0, 'z15': 0, 'z16': 0, 'z17': 0
};

const zoneCapacity = {
  'z1': 5000, 'z2': 5000, 'z3': 3000, 'z4': 3000,
  'z5': 12000, 'z6': 12000, 'z7': 15000, 'z8': 15000,
  'z9': 2000, 'z10': 3000, 'z11': 3000, 'z12': 500,
  'z13': 500, 'z14': 1000, 'z15': 2000, 'z16': 15000, 'z17': 8000
};

const zoneNames = {
  'z1': 'North Gate', 'z2': 'South Gate', 'z3': 'East Gate', 'z4': 'West Gate',
  'z5': 'Section A', 'z6': 'Section B', 'z7': 'Section C', 'z8': 'Section D',
  'z9': 'VIP Lounge', 'z10': 'Food Court N', 'z11': 'Food Court S',
  'z12': 'Restrooms W', 'z13': 'Restrooms E', 'z14': 'Merchandise',
  'z15': 'Emergency Exit', 'z16': 'Parking', 'z17': 'Main Corridor'
};

// Hourly attendance pattern (realistic event flow)
function getAttendanceRate(minute) {
  // Pre-event build-up (0-60 min): rapid increase
  if (minute < 60) return 0.015 * Math.sin((minute / 60) * Math.PI / 2);
  // Event start (60-90 min): peak entry
  if (minute < 90) return 0.005;
  // Settled (90-180 min): stable with minor fluctuations
  if (minute < 180) return 0.001 * Math.sin(minute / 30);
  // Post-event exodus (180-240 min): rapid decrease
  return -0.01 * ((minute - 180) / 60);
}

function simulateCrowdMovement() {
  const rate = getAttendanceRate(simulationTime);
  const change = Math.floor(rate * MAX_CAPACITY) + Math.floor(Math.random() * 200 - 100);
  
  totalAttendees = Math.max(0, Math.min(MAX_CAPACITY, totalAttendees + change));
  if (totalAttendees > peakAttendance) peakAttendance = totalAttendees;

  // Distribute attendees across zones
  const distributions = {
    'z1': 0.06, 'z2': 0.06, 'z3': 0.04, 'z4': 0.04,
    'z5': 0.16, 'z6': 0.16, 'z7': 0.15, 'z8': 0.15,
    'z9': 0.03, 'z10': 0.04, 'z11': 0.04, 'z12': 0.01,
    'z13': 0.01, 'z14': 0.02, 'z15': 0.0, 'z16': 0.01, 'z17': 0.02
  };

  // Add noise and time-based shifts
  Object.keys(zoneOccupancy).forEach(zoneId => {
    const baseOccupancy = totalAttendees * distributions[zoneId];
    const noise = (Math.random() - 0.5) * baseOccupancy * 0.3;
    
    // During halftime (120-135 min), more people in concession/restroom zones
    let modifier = 1;
    if (simulationTime >= 120 && simulationTime <= 135) {
      if (['z10', 'z11', 'z12', 'z13', 'z14'].includes(zoneId)) modifier = 2.5;
      if (['z5', 'z6', 'z7', 'z8'].includes(zoneId)) modifier = 0.6;
    }
    
    zoneOccupancy[zoneId] = Math.max(0, Math.min(
      zoneCapacity[zoneId],
      Math.floor((baseOccupancy + noise) * modifier)
    ));
  });

  return zoneOccupancy;
}

function simulateQueues() {
  const queues = queuesRoute.getQueues();
  const isHalftime = simulationTime >= 120 && simulationTime <= 135;
  const isPreEvent = simulationTime < 60;
  
  Object.keys(queues).forEach(qId => {
    let baseFactor = totalAttendees / MAX_CAPACITY;
    
    // Boost during halftime
    if (isHalftime && ['q1', 'q2', 'q5', 'q6', 'q7'].includes(qId)) {
      baseFactor *= 2.5;
    }
    
    // Boost entry queues before event
    if (isPreEvent && ['q3', 'q4'].includes(qId)) {
      baseFactor *= 2;
    }

    const maxLen = queues[qId].maxLength;
    const newLength = Math.min(maxLen, Math.max(0, 
      Math.floor(maxLen * baseFactor * (0.7 + Math.random() * 0.6))
    ));

    queuesRoute.updateQueue(qId, { currentLength: newLength });
  });
}

function simulateSensors() {
  const sensors = sensorsRoute.getSensors();
  const crowdFactor = totalAttendees / MAX_CAPACITY;

  Object.keys(sensors).forEach(sId => {
    const sensor = sensors[sId];
    let newValue;

    switch (sensor.type) {
      case 'temperature':
        // Temperature rises with crowd density
        newValue = 20 + crowdFactor * 8 + (Math.random() - 0.5) * 2;
        break;
      case 'humidity':
        newValue = 40 + crowdFactor * 25 + (Math.random() - 0.5) * 5;
        break;
      case 'noise':
        // Noise spikes during goals/exciting moments
        const excitementSpike = Math.random() > 0.95 ? 20 : 0;
        newValue = 50 + crowdFactor * 40 + excitementSpike + (Math.random() - 0.5) * 5;
        break;
      case 'occupancy':
        const zoneId = sensor.zone === 'North Gate' ? 'z1' : 'z2';
        newValue = zoneOccupancy[zoneId] || 0;
        break;
      case 'air_quality':
        newValue = 30 + crowdFactor * 50 + (Math.random() - 0.5) * 10;
        break;
      case 'motion':
        newValue = Math.floor(crowdFactor * 100 * (0.5 + Math.random()));
        break;
      case 'camera':
        newValue = Math.floor(crowdFactor * 100);
        break;
      default:
        newValue = sensor.value;
    }

    // Battery drain
    const newBattery = Math.max(0, sensor.battery - (Math.random() * 0.02));

    sensorsRoute.updateSensor(sId, { 
      value: Math.round(newValue * 10) / 10, 
      battery: Math.round(newBattery * 10) / 10 
    });
  });
}

function generateAlerts(io) {
  const crowdFactor = totalAttendees / MAX_CAPACITY;

  // Crowd density alert
  if (crowdFactor > 0.85 && Math.random() > 0.8) {
    const alert = alertsRoute.addAlert({
      title: 'High Crowd Density',
      message: `Venue is at ${Math.round(crowdFactor * 100)}% capacity. Consider opening additional gates.`,
      type: 'crowd',
      severity: crowdFactor > 0.95 ? 'critical' : 'high',
      zone: 'All Zones'
    });
    io.emit('new-alert', alert);
  }

  // Queue alert
  const queues = queuesRoute.getQueues();
  Object.values(queues).forEach(q => {
    if (q.status === 'full' && Math.random() > 0.9) {
      const alert = alertsRoute.addAlert({
        title: `Queue Full: ${q.name}`,
        message: `Wait time is ${q.estimatedWaitTime} minutes. ${q.currentLength} people waiting.`,
        type: 'warning',
        severity: 'medium',
        zone: q.zone
      });
      io.emit('new-alert', alert);
    }
  });

  // Environmental alerts
  const sensors = sensorsRoute.getSensors();
  Object.values(sensors).forEach(s => {
    if (s.type === 'temperature' && s.value > 30 && Math.random() > 0.95) {
      const alert = alertsRoute.addAlert({
        title: 'High Temperature Warning',
        message: `${s.zone}: Temperature reached ${s.value}°C. Increase ventilation.`,
        type: 'weather',
        severity: 'medium',
        zone: s.zone
      });
      io.emit('new-alert', alert);
    }
    if (s.type === 'noise' && s.value > 95 && Math.random() > 0.95) {
      const alert = alertsRoute.addAlert({
        title: 'Noise Level Alert',
        message: `${s.zone}: Noise at ${Math.round(s.value)}dB - exceeding safe levels.`,
        type: 'warning',
        severity: 'low',
        zone: s.zone
      });
      io.emit('new-alert', alert);
    }
  });
}

function updateAnalytics() {
  const queues = queuesRoute.getQueues();
  const sensors = sensorsRoute.getSensors();
  
  const avgWait = Object.values(queues).reduce((a, q) => a + q.estimatedWaitTime, 0) / Object.values(queues).length;
  const crowdDensity = Math.round((totalAttendees / MAX_CAPACITY) * 100);

  // Build hourly attendance data
  const hourIndex = Math.floor(simulationTime / 15);
  const hourlyAttendance = [];
  for (let i = 0; i <= hourIndex; i++) {
    hourlyAttendance.push({
      time: `${Math.floor(i * 15 / 60)}:${String(i * 15 % 60).padStart(2, '0')}`,
      attendance: Math.floor(MAX_CAPACITY * Math.abs(getAttendanceRate(i * 15)) * 50 + Math.random() * 5000),
      predicted: Math.floor(MAX_CAPACITY * Math.abs(getAttendanceRate(i * 15)) * 55)
    });
  }

  // Zone density for chart
  const zoneDensityHistory = Object.keys(zoneOccupancy).map(zId => ({
    zone: zoneNames[zId],
    current: zoneOccupancy[zId],
    capacity: zoneCapacity[zId],
    density: Math.round((zoneOccupancy[zId] / zoneCapacity[zId]) * 100)
  }));

  // Queue wait times for chart
  const queueWaitHistory = Object.values(queues).map(q => ({
    name: q.name,
    waitTime: q.estimatedWaitTime,
    length: q.currentLength,
    status: q.status
  }));

  // Heatmap data for zones
  const heatmapData = Object.keys(zoneOccupancy).map(zId => ({
    zoneId: zId,
    name: zoneNames[zId],
    density: zoneOccupancy[zId] / zoneCapacity[zId],
    occupancy: zoneOccupancy[zId],
    capacity: zoneCapacity[zId]
  }));

  analyticsRoute.updateAnalytics({
    totalAttendees,
    peakAttendance,
    averageDwellTime: Math.round(avgWait * 10) / 10,
    crowdDensity,
    satisfactionScore: Math.max(3, 5 - (avgWait / 10)),
    revenueEstimate: totalAttendees * 45,
    hourlyAttendance,
    zoneDensityHistory,
    queueWaitHistory,
    heatmapData,
    predictions: {
      nextHourAttendance: Math.min(MAX_CAPACITY, totalAttendees + Math.floor(Math.random() * 5000)),
      peakTime: simulationTime < 90 ? 'In ~30 min' : 'Peak reached',
      crowdDirection: simulationTime < 120 ? 'Inbound' : simulationTime < 180 ? 'Stable' : 'Outbound',
      exitEstimate: `${Math.floor((EVENT_DURATION - simulationTime) / 60)}h ${(EVENT_DURATION - simulationTime) % 60}m remaining`
    }
  });
}

function startSimulation(io) {
  console.log('🎮 Starting venue simulation engine...');

  // Main simulation loop - runs every 2 seconds (1 sim-minute = 2 real seconds)
  setInterval(() => {
    simulationTime = (simulationTime + 1) % EVENT_DURATION;
    
    // Reset at start of new cycle
    if (simulationTime === 0) {
      totalAttendees = 0;
      peakAttendance = 0;
    }

    // Run simulations
    const occupancy = simulateCrowdMovement();
    simulateQueues();
    simulateSensors();
    updateAnalytics();

    // Generate alerts occasionally
    if (simulationTime % 5 === 0) {
      generateAlerts(io);
    }

    // Emit real-time data to all connected clients
    io.emit('venue-update', {
      timestamp: new Date().toISOString(),
      simulationTime,
      totalAttendees,
      maxCapacity: MAX_CAPACITY,
      crowdDensity: Math.round((totalAttendees / MAX_CAPACITY) * 100),
      zones: Object.keys(zoneOccupancy).map(zId => ({
        id: zId,
        name: zoneNames[zId],
        occupancy: zoneOccupancy[zId],
        capacity: zoneCapacity[zId],
        density: Math.round((zoneOccupancy[zId] / zoneCapacity[zId]) * 100)
      })),
      queues: Object.values(queuesRoute.getQueues()).map(q => ({
        id: q._id,
        name: q.name,
        type: q.type,
        length: q.currentLength,
        waitTime: q.estimatedWaitTime,
        status: q.status
      })),
      sensors: Object.values(sensorsRoute.getSensors()).map(s => ({
        id: s.sensorId,
        name: s.name,
        type: s.type,
        value: s.value,
        unit: s.unit,
        status: s.status,
        battery: s.battery
      }))
    });

  }, 2000);
}

module.exports = { startSimulation };

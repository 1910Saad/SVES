const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Structured Google Cloud Logging
const log = (severity, message, payload = {}) => {
  console.log(JSON.stringify({ severity, message, ...payload, timestamp: new Date().toISOString() }));
};

const authRoutes = require('./routes/auth');
const venueRoutes = require('./routes/venues');
const eventRoutes = require('./routes/events');
const zoneRoutes = require('./routes/zones');
const queueRoutes = require('./routes/queues');
const alertRoutes = require('./routes/alerts');
const analyticsRoutes = require('./routes/analytics');
const sensorRoutes = require('./routes/sensors');
const { setupSocketHandlers } = require('./sockets');
const { startSimulation } = require('./simulation/engine');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Rate limiting - Pro-tier limits for real-time dashboard
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 to support high-frequency analytics polling
  message: { error: 'Too many requests. Please wait 15 minutes or contact support.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sensors', sensorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  };
  log('INFO', 'Health check performed', healthInfo);
  res.json(healthInfo);
});

// Socket.IO handlers
setupSocketHandlers(io);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sves';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start the simulation engine
    startSimulation(io);
    console.log('🎮 Simulation engine started');
  })
  .catch(err => {
    console.warn('⚠️  MongoDB not available, running with in-memory data');
    console.warn('   Install MongoDB or use MongoDB Atlas free tier');
    
    // Start simulation even without DB
    startSimulation(io);
    console.log('🎮 Simulation engine started (no-db mode)');
  });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  log('INFO', `SVES Backend listening on port ${PORT}`, { 
    port: PORT, 
    env: process.env.NODE_ENV || 'development' 
  });
});

module.exports = { app, server, io };

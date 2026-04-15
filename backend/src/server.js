const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
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
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🏟️  SVES Backend Server                    ║
  ║   Smart Venue Experience System              ║
  ║                                              ║
  ║   🌐 HTTP:   http://localhost:${PORT}           ║
  ║   🔌 WS:     ws://localhost:${PORT}             ║
  ║   📊 Health: http://localhost:${PORT}/api/health ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };

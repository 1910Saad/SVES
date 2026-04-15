function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join venue room
    socket.on('join-venue', (venueId) => {
      socket.join(`venue:${venueId}`);
      console.log(`📍 ${socket.id} joined venue: ${venueId}`);
    });

    // Join zone room
    socket.on('join-zone', (zoneId) => {
      socket.join(`zone:${zoneId}`);
    });

    // Subscribe to specific data channels
    socket.on('subscribe', (channels) => {
      if (Array.isArray(channels)) {
        channels.forEach(ch => socket.join(ch));
      }
    });

    // Attendee location update
    socket.on('location-update', (data) => {
      io.to(`venue:${data.venueId}`).emit('attendee-moved', {
        attendeeId: socket.id,
        ...data
      });
    });

    // Emergency button
    socket.on('emergency', (data) => {
      io.emit('emergency-alert', {
        ...data,
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
    });

    // Request navigation
    socket.on('navigate', (data) => {
      // Simple pathfinding response
      socket.emit('navigation-route', {
        from: data.from,
        to: data.to,
        estimatedTime: Math.floor(Math.random() * 10) + 2,
        path: generateSimplePath(data.from, data.to)
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

function generateSimplePath(from, to) {
  // Generate intermediate waypoints
  const steps = 5;
  const path = [];
  for (let i = 0; i <= steps; i++) {
    path.push({
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps
    });
  }
  return path;
}

module.exports = { setupSocketHandlers };

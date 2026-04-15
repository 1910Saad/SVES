const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['concession', 'restroom', 'entry', 'exit', 'merchandise', 'ticket', 'vip'], required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  zone: { type: String, required: true },
  currentLength: { type: Number, default: 0 },
  maxLength: { type: Number, default: 100 },
  estimatedWaitTime: { type: Number, default: 0 }, // in minutes
  averageServiceTime: { type: Number, default: 3 }, // in minutes
  status: { type: String, enum: ['open', 'busy', 'full', 'closed'], default: 'open' },
  servers: { type: Number, default: 1 }, // number of service points
  historicalData: [{
    timestamp: { type: Date },
    length: { type: Number },
    waitTime: { type: Number }
  }],
  coordinates: {
    x: { type: Number },
    y: { type: Number }
  }
}, { timestamps: true });

// Auto-calculate wait time
queueSchema.pre('save', function(next) {
  if (this.isModified('currentLength') || this.isModified('servers')) {
    this.estimatedWaitTime = Math.ceil((this.currentLength * this.averageServiceTime) / Math.max(this.servers, 1));
    
    if (this.currentLength >= this.maxLength * 0.9) {
      this.status = 'full';
    } else if (this.currentLength >= this.maxLength * 0.6) {
      this.status = 'busy';
    } else {
      this.status = 'open';
    }
  }
  next();
});

module.exports = mongoose.model('Queue', queueSchema);

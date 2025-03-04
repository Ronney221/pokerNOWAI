const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlayerPerformanceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true,
    index: true
  },
  ledgerId: {
    type: Schema.Types.ObjectId,
    ref: 'Ledger',
    required: true
  },
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  sessionName: {
    type: String,
    required: true,
    trim: true
  },
  sessionDate: {
    type: Date,
    required: true
  },
  buyIn: {
    type: Number,
    required: true
  },
  cashOut: {
    type: Number,
    required: true
  },
  profit: {
    type: Number,
    required: true
  },
  denomination: {
    type: String,
    enum: ['cents', 'dollars'],
    default: 'cents'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
PlayerPerformanceSchema.index({ firebaseUid: 1 });
PlayerPerformanceSchema.index({ createdAt: -1 });
PlayerPerformanceSchema.index({ sessionDate: -1 });

// Static method to find performances by firebase user ID
PlayerPerformanceSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.find({ firebaseUid }).sort({ sessionDate: -1 });
};

const PlayerPerformance = mongoose.model('PlayerPerformance', PlayerPerformanceSchema);

module.exports = PlayerPerformance; 
const mongoose = require('mongoose');

/**
 * PokerLog Schema
 * @typedef {Object} PokerLogSchema
 * @property {string} userId - Reference to the user who uploaded the log
 * @property {string} fileName - Original file name
 * @property {string} fileContent - Content of the poker log file
 * @property {Date} uploadDate - When the log was uploaded
 * @property {Date} gameDate - When the poker game took place
 * @property {boolean} processed - Whether the log has been processed
 * @property {Array<Object>} processingErrors - Any errors encountered during processing
 */
const pokerLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileContent: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  gameDate: {
    type: Date,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingErrors: [{
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    handCount: Number,
    players: [String],
    gameType: String,
    stakes: String
  }
});

// Optimized indexes with documentation
pokerLogSchema.index({ 
  userId: 1, 
  uploadDate: -1 
}, {
  name: 'user_upload_history',
  background: true,
  description: 'Supports queries for user\'s upload history, sorted by date'
});

pokerLogSchema.index({ 
  processed: 1, 
  uploadDate: 1 
}, {
  name: 'processing_queue',
  background: true,
  description: 'Supports queries for unprocessed logs in upload order'
});

// Instance methods
pokerLogSchema.methods.addError = function(errorMessage) {
  this.processingErrors.push({
    message: errorMessage,
    timestamp: new Date()
  });
  return this.save();
};

pokerLogSchema.methods.markAsProcessed = function() {
  this.processed = true;
  return this.save();
};

// Static methods
pokerLogSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ uploadDate: -1 });
};

pokerLogSchema.statics.findUnprocessed = function() {
  return this.find({ processed: false }).sort({ uploadDate: 1 });
};

const PokerLog = mongoose.model('PokerLog', pokerLogSchema);
module.exports = PokerLog; 
const mongoose = require('mongoose');

/**
 * Analysis Schema
 * @typedef {Object} AnalysisSchema
 * @property {ObjectId} userId - Reference to the user who owns the analysis
 * @property {string} name - Custom name for the analysis
 * @property {string} originalFileName - Original poker log file name
 * @property {Date} analysisDate - When the analysis was performed
 * @property {Object} results - Analysis results
 * @property {Object} metadata - Game metadata
 * @property {string} status - Current status of the analysis
 * @property {string} errorMessage - Error message if analysis failed
 */
const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    trim: true,
    default: function() {
      return `Analysis ${this.analysisDate ? new Date(this.analysisDate).toLocaleDateString() : 'New'}`;
    }
  },
  originalFileName: {
    type: String,
    required: true
  },
  analysisDate: {
    type: Date,
    default: Date.now
  },
  results: {
    handStats: {
      totalHands: Number,
      handsWon: Number,
      handsLost: Number,
      biggestPot: Number,
      totalProfit: Number
    },
    playerStats: [{
      playerName: String,
      handsPlayed: Number,
      vpip: Number,
      pfr: Number,
      aggression: Number,
      winRate: Number
    }],
    timeStats: {
      averageHandDuration: Number,
      totalPlayTime: Number,
      peakHourPerformance: {
        hour: Number,
        profit: Number
      }
    },
    raw: mongoose.Schema.Types.Mixed
  },
  metadata: {
    gameType: {
      type: String,
      required: true,
      enum: ['cash', 'tournament', 'sng']
    },
    handCount: {
      type: Number,
      required: true,
      min: 1
    },
    dateRange: {
      start: Date,
      end: Date
    },
    stakes: {
      currency: String,
      smallBlind: Number,
      bigBlind: Number
    },
    players: [String]
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  errorMessage: String,
  processingTime: Number
});

// Instance methods
analysisSchema.methods.markAsCompleted = function(results) {
  this.status = 'completed';
  this.results = results;
  this.processingTime = Date.now() - this.analysisDate;
  return this.save();
};

analysisSchema.methods.markAsError = function(errorMessage) {
  this.status = 'error';
  this.errorMessage = errorMessage;
  this.processingTime = Date.now() - this.analysisDate;
  return this.save();
};

// Static methods
analysisSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ analysisDate: -1 });
};

analysisSchema.statics.findPending = function() {
  return this.find({ status: 'processing' }).sort({ analysisDate: 1 });
};

// Optimized indexes with documentation
analysisSchema.index({ 
  userId: 1, 
  analysisDate: -1 
}, {
  name: 'user_analysis_date',
  background: true,
  description: 'Supports queries for user\'s analysis history, sorted by date'
});

analysisSchema.index({ 
  status: 1, 
  analysisDate: 1 
}, {
  name: 'analysis_status',
  background: true,
  description: 'Supports queries for analysis status monitoring and cleanup'
});

// Virtual for processing duration
analysisSchema.virtual('duration').get(function() {
  return this.processingTime ? `${(this.processingTime / 1000).toFixed(2)}s` : null;
});

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis; 
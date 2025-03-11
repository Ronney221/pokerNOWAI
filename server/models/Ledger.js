const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const PlayerSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  aliases: [{
    type: String,
    trim: true
  }],
  buyIn: {
    type: Number,
    default: 0
  },
  cashOut: {
    type: Number,
    default: 0
  }
});

const LedgerSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  sessionName: {
    type: String,
    trim: true,
    default: 'Poker Session'
  },
  sessionDate: {
    type: Date,
    default: Date.now
  },
  players: [PlayerSchema],
  transactions: [TransactionSchema],
  originalFileName: {
    type: String,
    trim: true
  },
  denomination: {
    type: String,
    enum: ['cents', 'dollars'],
    default: 'cents'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareCode: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Optimized indexes with documentation
LedgerSchema.index({ 
  firebaseUid: 1, 
  sessionDate: -1 
}, {
  name: 'user_session_history',
  background: true,
  description: 'Supports queries for user\'s ledger history, sorted by session date'
});

LedgerSchema.index({ 
  shareCode: 1 
}, {
  name: 'shared_ledger_lookup',
  sparse: true,
  background: true,
  description: 'Supports lookups of shared ledgers by their share code'
});

LedgerSchema.index({ 
  createdAt: -1 
}, {
  name: 'creation_date',
  background: true,
  description: 'Supports queries sorted by creation date'
});

// Static method to find ledgers by firebase user ID
LedgerSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.find({ firebaseUid }).sort({ sessionDate: -1 });
};

const Ledger = mongoose.model('Ledger', LedgerSchema);

module.exports = Ledger; 
const mongoose = require('mongoose');

const pokerLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
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
    message: String,
    timestamp: Date
  }]
});

const PokerLog = mongoose.model('PokerLog', pokerLogSchema);
module.exports = PokerLog; 
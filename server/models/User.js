const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
  analyses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis'
  }],
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  }
});

// No need for additional index declarations since we're using unique: true in the schema fields

const User = mongoose.model('User', userSchema);

module.exports = User; 
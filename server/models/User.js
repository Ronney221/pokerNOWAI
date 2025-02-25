const mongoose = require('mongoose');

/**
 * User Schema
 * @typedef {Object} UserSchema
 * @property {string} firebaseUid - Firebase User ID
 * @property {string} username - Unique username
 * @property {string} email - User's email address
 * @property {string} displayName - User's display name
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} lastLogin - Last login timestamp
 * @property {Array<ObjectId>} analyses - References to analysis documents
 * @property {Map<string, any>} settings - User preferences and settings
 */
const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
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

// Instance methods
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.addAnalysis = async function(analysisId) {
  if (!this.analyses.includes(analysisId)) {
    this.analyses.push(analysisId);
    return this.save();
  }
  return this;
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// No need for additional index declarations since we're using unique: true in the schema fields

const User = mongoose.model('User', userSchema);

module.exports = User; 
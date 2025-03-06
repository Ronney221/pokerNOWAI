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
 * @property {boolean} isPremium - Whether the user has premium access
 * @property {Date} premiumSince - When the user became premium
 * @property {Date} premiumUntil - When the premium access expires
 * @property {string} subscriptionStatus - Current subscription status
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
  },
  // Premium/Paid User Fields
  isPremium: {
    type: Boolean,
    default: false,
    index: true // Index for faster queries on premium status
  },
  premiumSince: {
    type: Date,
    default: null
  },
  premiumUntil: {
    type: Date,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'cancelled', 'expired'],
    default: 'none'
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

// Premium-related instance methods
userSchema.methods.activatePremium = async function(durationInDays = 30) {
  const now = new Date();
  this.isPremium = true;
  this.premiumSince = this.premiumSince || now;
  this.premiumUntil = new Date(now.getTime() + durationInDays * 24 * 60 * 60 * 1000);
  this.subscriptionStatus = 'active';
  return this.save();
};

userSchema.methods.deactivatePremium = async function() {
  this.isPremium = false;
  this.subscriptionStatus = 'expired';
  return this.save();
};

userSchema.methods.cancelPremium = async function() {
  this.subscriptionStatus = 'cancelled';
  return this.save();
};

userSchema.methods.checkPremiumStatus = function() {
  if (!this.isPremium) return false;
  if (!this.premiumUntil) return false;
  
  const now = new Date();
  if (now > this.premiumUntil) {
    // Premium has expired
    this.isPremium = false;
    this.subscriptionStatus = 'expired';
    this.save(); // Save the updated status
    return false;
  }
  return true;
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Premium-related static methods
userSchema.statics.findPremiumUsers = function() {
  return this.find({ isPremium: true });
};

userSchema.statics.findExpiredPremiumUsers = function() {
  const now = new Date();
  return this.find({
    isPremium: true,
    premiumUntil: { $lt: now }
  });
};

// Create indexes
userSchema.index({ isPremium: 1, premiumUntil: 1 }); // Compound index for premium queries

const User = mongoose.model('User', userSchema);

module.exports = User; 
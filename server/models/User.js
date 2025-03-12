const mongoose = require('mongoose');

/**
 * User Schema
 * @typedef {Object} UserSchema
 * @property {string} firebaseUid - Firebase User ID
 * @property {string} username - Unique username
 * @property {string} email - User's email address
 * @property {string} displayName - User's display name
 * @property {string} photoURL - User's photo URL
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} lastLogin - Last login timestamp
 * @property {Array<ObjectId>} analyses - References to analysis documents
 * @property {Map<string, any>} settings - User preferences and settings
 * @property {boolean} isPremium - Whether the user has premium access
 * @property {Date} premiumSince - When the user became premium
 * @property {Date} premiumUntil - When the premium access expires
 * @property {string} subscriptionStatus - Current subscription status
 * @property {string} stripeCustomerId - Stripe Customer ID
 * @property {string} stripeSubscriptionId - Stripe Subscription ID
 * @property {Date} lastPayment - Last payment timestamp
 * @property {Number} lastPaymentAmount - Last payment amount
 * @property {String} lastPaymentCurrency - Last payment currency
 * @property {String} lastPaymentIntent - Last payment intent
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
  photoURL: {
    type: String,
    trim: true,
    default: null
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
  // Free Trial Fields
  isTrialActive: {
    type: Boolean,
    default: false,
    index: true
  },
  trialStartDate: {
    type: Date,
    default: null
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  hasUsedTrial: {
    type: Boolean,
    default: false
  },
  // Stripe Integration Fields
  stripeCustomerId: {
    type: String,
    sparse: true,
    unique: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true,
    unique: true
  },
  lastPayment: {
    date: Date,
    amount: Number,
    currency: String,
    paymentIntent: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
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

// Premium and Trial-related instance methods
userSchema.methods.activatePremium = async function() {
  const now = new Date();
  this.isPremium = true;
  this.premiumSince = this.premiumSince || now;
  // If user was in trial, end it
  if (this.isTrialActive) {
    this.endTrial();
  }
  return this.save();
};

userSchema.methods.startTrial = async function() {
  if (this.hasUsedTrial || this.isPremium) {
    throw new Error('User is not eligible for trial');
  }
  
  const now = new Date();
  this.isTrialActive = true;
  this.trialStartDate = now;
  this.trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  this.hasUsedTrial = true;
  return this.save();
};

userSchema.methods.endTrial = async function() {
  this.isTrialActive = false;
  this.trialEndDate = new Date(); // Set to current time
  return this.save();
};

userSchema.methods.checkTrialStatus = function() {
  if (!this.isTrialActive || !this.trialEndDate) {
    return false;
  }
  
  const now = new Date();
  if (now > this.trialEndDate) {
    // Trial has expired
    this.isTrialActive = false;
    this.save(); // Save the updated status
    return false;
  }
  return true;
};

userSchema.methods.isEligibleForTrial = function() {
  return !this.hasUsedTrial && !this.isPremium;
};

userSchema.methods.checkPremiumStatus = function() {
  return this.isPremium || this.checkTrialStatus();
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

// Add static method to find users in trial
userSchema.statics.findTrialUsers = function() {
  return this.find({ 
    isTrialActive: true,
    trialEndDate: { $gt: new Date() }
  });
};

// Add static method to find expired trial users
userSchema.statics.findExpiredTrialUsers = function() {
  return this.find({
    isTrialActive: true,
    trialEndDate: { $lt: new Date() }
  });
};

// Compound index for premium status queries
userSchema.index({ 
  isPremium: 1, 
  premiumUntil: 1 
}, { 
  name: 'premium_status',
  background: true,
  // This index helps with queries checking active premium status
  description: 'Supports queries for active premium users and expiration checks'
});

// Index for Stripe lookups
userSchema.index({ 
  stripeCustomerId: 1 
}, {
  name: 'stripe_customer',
  background: true,
  sparse: true,
  description: 'Supports lookups by Stripe Customer ID'
});

userSchema.index({ 
  stripeSubscriptionId: 1 
}, {
  name: 'stripe_subscription',
  background: true,
  sparse: true,
  description: 'Supports lookups by Stripe Subscription ID'
});

// Add index for trial queries
userSchema.index({ 
  isTrialActive: 1, 
  trialEndDate: 1,
  hasUsedTrial: 1
}, { 
  name: 'trial_status',
  background: true,
  description: 'Supports queries for trial status and eligibility checks'
});

const User = mongoose.model('User', userSchema);

module.exports = User; 
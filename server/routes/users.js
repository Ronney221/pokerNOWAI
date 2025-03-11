const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or update user
router.post('/saveUserData', async (req, res) => {
  try {
    console.log('=== START saveUserData route ===');
    console.log('Received user data:', req.body);
    const { firebaseUid, email, username, displayName } = req.body;
    
    if (!firebaseUid || !email) {
      console.error('Missing required fields:', { firebaseUid, email });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { firebaseUid: !firebaseUid, email: !email }
      });
    }

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ 
      $or: [
        { firebaseUid },
        { email },
        { username }
      ]
    });

    if (existingUser) {
      console.log('Found existing user:', {
        id: existingUser._id,
        firebaseUid: existingUser.firebaseUid,
        email: existingUser.email
      });
      
      try {
        const updatedUser = await User.findOneAndUpdate(
          { firebaseUid },
          { 
            email,
            username: username || email.split('@')[0],
            displayName: displayName || username || email.split('@')[0],
            lastLogin: new Date()
          },
          { 
            new: true,
            runValidators: true
          }
        );
        console.log('Successfully updated user:', updatedUser);
        return res.status(200).json({ user: updatedUser });
      } catch (updateError) {
        console.error('Error updating existing user:', updateError);
        throw updateError;
      }
    }

    // Create new user
    console.log('Creating new user with data:', {
      firebaseUid,
      email,
      username: username || email.split('@')[0],
      displayName: displayName || username || email.split('@')[0]
    });

    const user = new User({
      firebaseUid,
      email,
      username: username || email.split('@')[0],
      displayName: displayName || username || email.split('@')[0],
      lastLogin: new Date()
    });

    try {
      await user.save();
      console.log('Successfully saved new user:', user);
      res.status(200).json({ user });
    } catch (saveError) {
      console.error('Error saving new user:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('=== Detailed error in saveUserData route ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);

    // Check for specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      console.error('Duplicate key error details:', error.keyPattern);
      return res.status(409).json({ 
        error: 'Username or email already exists',
        details: error.keyPattern,
        code: error.code
      });
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message),
        code: error.code
      });
    }

    console.error('=== END error in saveUserData route ===');
    res.status(500).json({ 
      error: 'Server error while saving user data',
      message: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
});

// Get user by Firebase UID
router.get('/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.patch('/:firebaseUid/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      { $set: { settings } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's analyses
router.get('/:firebaseUid/analyses', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid })
      .populate('analyses');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ analyses: user.analyses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user status
router.get('/:uid/status', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check trial status if needed
    if (user.isTrialActive) {
      user.checkTrialStatus(); // This will update the status if trial has expired
    }

    // Return relevant status information
    res.json({
      isPremium: user.isPremium,
      isTrialActive: user.isTrialActive,
      hasUsedTrial: user.hasUsedTrial,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      premiumSince: user.premiumSince
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start trial endpoint
router.post('/start-trial', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Find the user
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is eligible for trial
    if (user.isPremium) {
      return res.status(400).json({
        success: false,
        error: 'User already has premium access'
      });
    }

    if (user.hasUsedTrial) {
      return res.status(400).json({
        success: false,
        error: 'User has already used their trial'
      });
    }

    if (user.isTrialActive) {
      return res.status(400).json({
        success: false,
        error: 'User already has an active trial'
      });
    }

    // Start the trial
    const now = new Date();
    user.isTrialActive = true;
    user.trialStartDate = now;
    user.trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    user.hasUsedTrial = true;

    await user.save();

    console.log('Trial activated successfully:', {
      userId: user.firebaseUid,
      email: user.email,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate
    });

    res.json({
      success: true,
      message: 'Trial activated successfully',
      trialEndDate: user.trialEndDate
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 
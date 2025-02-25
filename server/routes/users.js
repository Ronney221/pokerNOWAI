const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or update user
router.post('/saveUserData', async (req, res) => {
  try {
    console.log('Received user data:', req.body);
    const { firebaseUid, email, username, displayName } = req.body;
    
    if (!firebaseUid || !email) {
      console.error('Missing required fields:', { firebaseUid, email });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Attempting to save/update user with firebaseUid:', firebaseUid);
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        email,
        username: username || email.split('@')[0],
        displayName: displayName || username || email.split('@')[0],
        lastLogin: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
    
    console.log('User saved successfully:', user);
    res.status(200).json({ user });
  } catch (error) {
    console.error('Detailed error saving user data:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: error.message });
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

module.exports = router; 
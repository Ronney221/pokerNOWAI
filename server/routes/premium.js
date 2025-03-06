const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const premiumCheck = require('../middleware/premiumCheck');

/**
 * @route GET /api/premium/status
 * @description Get user's premium status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const isPremium = user.checkPremiumStatus();
    
    res.json({
      isPremium,
      subscriptionStatus: user.subscriptionStatus,
      premiumSince: user.premiumSince,
      premiumUntil: user.premiumUntil
    });
  } catch (error) {
    console.error('Error getting premium status:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route POST /api/premium/activate
 * @description Activate premium subscription (placeholder for payment integration)
 */
router.post('/activate', auth, async (req, res) => {
  try {
    const { durationInDays = 30 } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // TODO: Integrate with your payment processor (Stripe, PayPal, etc.)
    // This is a placeholder for now
    await user.activatePremium(durationInDays);

    res.json({
      message: 'Premium activated successfully',
      isPremium: true,
      subscriptionStatus: user.subscriptionStatus,
      premiumUntil: user.premiumUntil
    });
  } catch (error) {
    console.error('Error activating premium:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route POST /api/premium/cancel
 * @description Cancel premium subscription
 */
router.post('/cancel', auth, premiumCheck(), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.cancelPremium();

    res.json({
      message: 'Premium subscription cancelled',
      subscriptionStatus: user.subscriptionStatus,
      premiumUntil: user.premiumUntil
    });
  } catch (error) {
    console.error('Error cancelling premium:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router; 
const User = require('../models/User');

/**
 * Middleware to check if user has premium access
 * @param {boolean} required - Whether premium is required (true) or optional (false)
 * @returns {Function} Express middleware
 */
const premiumCheck = (required = true) => {
  return async (req, res, next) => {
    try {
      // Get user from previous auth middleware
      const { userId } = req;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Find user and check premium status
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check premium status
      const isPremium = user.checkPremiumStatus();
      
      // Attach premium status to request
      req.isPremium = isPremium;
      
      // If premium is required and user is not premium
      if (required && !isPremium) {
        return res.status(403).json({
          error: 'Premium access required',
          code: 'PREMIUM_REQUIRED',
          upgradeUrl: '/premium' // URL to upgrade page
        });
      }

      next();
    } catch (error) {
      console.error('Premium check error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  };
};

module.exports = premiumCheck; 
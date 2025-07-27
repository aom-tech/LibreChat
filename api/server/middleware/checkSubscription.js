const { checkUserSubscription } = require('~/server/services/SubscriptionService');
const { getCustomConfig } = require('~/server/services/Config/customConfig');
const { logger } = require('~/config');

/**
 * Middleware to check if user has active subscription
 * Returns 402 Payment Required if subscription is required but not active
 */
const checkSubscription = async (req, res, next) => {
  try {
    // Check if subscription system is enabled
    const customConfig = await getCustomConfig();
    
    if (!customConfig?.subscription?.enabled) {
      // Subscription system not enabled, allow access
      return next();
    }

    // Skip check for certain routes (auth, subscription management, etc.)
    const skipRoutes = [
      '/api/auth',
      '/api/subscription',
      '/api/config',
      '/api/user/avatar',
      '/api/oauth',
      '/health',
    ];

    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      // Let auth middleware handle unauthenticated requests
      return next();
    }

    // Check user subscription status
    const subscription = await checkUserSubscription(req.user.id);

    if (!subscription.isActive) {
      logger.info('[CheckSubscription] Access denied - no active subscription', {
        userId: req.user.id,
        path: req.path,
      });

      return res.status(402).json({
        error: 'Subscription required',
        message: 'Please subscribe to continue using the service',
        subscription: {
          isActive: false,
          expiresAt: subscription.expiresAt,
        },
      });
    }

    // Add subscription info to request for downstream use
    req.subscription = subscription;

    next();
  } catch (error) {
    logger.error('[CheckSubscription] Error checking subscription:', error);
    // On error, allow access to prevent service disruption
    next();
  }
};

/**
 * Middleware to check if user has access to specific features
 */
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const customConfig = await getCustomConfig();
      
      if (!customConfig?.subscription?.enabled) {
        // Subscription system not enabled, allow access
        return next();
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const subscription = await checkUserSubscription(req.user.id);

      if (!subscription.isActive) {
        return res.status(402).json({
          error: 'Subscription required',
          message: 'Please subscribe to access this feature',
        });
      }

      // Check if user's subscription tier has access to the feature
      if (!subscription.features || !subscription.features[feature]) {
        logger.info('[CheckFeatureAccess] Feature not available in subscription', {
          userId: req.user.id,
          feature,
          tier: subscription.tier,
        });

        return res.status(403).json({
          error: 'Feature not available',
          message: `${feature} is not available in your current subscription plan`,
          requiredFeature: feature,
          currentTier: subscription.tier,
        });
      }

      next();
    } catch (error) {
      logger.error('[CheckFeatureAccess] Error checking feature access:', error);
      // On error, deny access for security
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};

module.exports = {
  checkSubscription,
  checkFeatureAccess,
};
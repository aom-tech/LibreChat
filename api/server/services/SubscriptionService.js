const { updateUserById, findUserById } = require('~/models/User');
const { getCustomConfig } = require('~/server/services/Config/customConfig');
const { logger } = require('~/config');

/**
 * Get subscription plans from configuration
 */
const getSubscriptionPlans = async () => {
  const customConfig = await getCustomConfig();
  
  if (!customConfig?.subscription?.enabled) {
    return null;
  }

  const defaultPlans = {
    basic: {
      name: 'Basic',
      price: 9.99,
      tokenCredits: 100000,
      features: {
        presentations: false,
        videos: false,
      },
      description: '100K tokens per month',
    },
    pro: {
      name: 'Pro',
      price: 29.99,
      tokenCredits: 500000,
      features: {
        presentations: true,
        videos: false,
      },
      description: '500K tokens per month with presentations',
    },
    enterprise: {
      name: 'Enterprise',
      price: 99.99,
      tokenCredits: 2000000,
      features: {
        presentations: true,
        videos: true,
      },
      description: '2M tokens per month with all features',
    },
  };

  return customConfig.subscription.plans || defaultPlans;
};

/**
 * Check if user has active subscription
 */
const checkUserSubscription = async (userId) => {
  const user = await findUserById(userId);
  
  if (!user) {
    return { isActive: false };
  }

  // Check if subscription is active and not expired
  const now = new Date();
  const isActive = user.isSubscriptionActive && 
    user.subscriptionExpiresAt && 
    new Date(user.subscriptionExpiresAt) > now;

  return {
    isActive,
    tier: user.subscriptionTier,
    expiresAt: user.subscriptionExpiresAt,
    features: user.subscriptionFeatures,
  };
};

/**
 * Activate user subscription
 */
const activateSubscription = async (userId, tier, durationDays = 30) => {
  const plans = await getSubscriptionPlans();
  
  if (!plans || !plans[tier]) {
    throw new Error('Invalid subscription tier');
  }

  const plan = plans[tier];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const updateData = {
    isSubscriptionActive: true,
    subscriptionTier: tier,
    subscriptionExpiresAt: expiresAt,
    subscriptionFeatures: plan.features,
  };

  // Update user subscription
  const updatedUser = await updateUserById(userId, updateData);

  // Update user balance based on plan
  const { updateUserBalance } = require('~/models');
  await updateUserBalance(userId, plan.tokenCredits);

  logger.info('[SubscriptionService] Subscription activated', {
    userId,
    tier,
    expiresAt,
  });

  return updatedUser;
};

/**
 * Cancel user subscription
 */
const cancelSubscription = async (userId) => {
  const updateData = {
    isSubscriptionActive: false,
    // Keep tier and expiry for history
  };

  const updatedUser = await updateUserById(userId, updateData);

  logger.info('[SubscriptionService] Subscription cancelled', {
    userId,
  });

  return updatedUser;
};

/**
 * Check and deactivate expired subscriptions
 */
const checkExpiredSubscriptions = async () => {
  const { User } = require('~/models');
  const now = new Date();

  const expiredUsers = await User.updateMany(
    {
      isSubscriptionActive: true,
      subscriptionExpiresAt: { $lt: now },
    },
    {
      isSubscriptionActive: false,
    }
  );

  if (expiredUsers.modifiedCount > 0) {
    logger.info('[SubscriptionService] Deactivated expired subscriptions', {
      count: expiredUsers.modifiedCount,
    });
  }

  return expiredUsers.modifiedCount;
};

module.exports = {
  getSubscriptionPlans,
  checkUserSubscription,
  activateSubscription,
  cancelSubscription,
  checkExpiredSubscriptions,
};
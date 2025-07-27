const { logger } = require('~/config');
const {
  getSubscriptionPlans,
  checkUserSubscription,
  activateSubscription,
  cancelSubscription,
} = require('~/server/services/SubscriptionService');

/**
 * Get subscription plans
 */
const getPlans = async (req, res) => {
  try {
    const plans = await getSubscriptionPlans();
    
    if (!plans) {
      return res.status(404).json({
        error: 'Subscription system is not enabled',
      });
    }

    res.json({ plans });
  } catch (error) {
    logger.error('[SubscriptionController] Error getting plans:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
};

/**
 * Get user subscription status
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await checkUserSubscription(userId);

    res.json({ subscription });
  } catch (error) {
    logger.error('[SubscriptionController] Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

/**
 * Create checkout session (placeholder for payment integration)
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;

    if (!tier || !['basic', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const plans = await getSubscriptionPlans();
    if (!plans || !plans[tier]) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // TODO: Integrate with payment provider (Stripe, PayPal, etc.)
    // For now, we'll create a mock checkout session
    const checkoutSession = {
      id: `cs_${Date.now()}_${userId}_${tier}`,
      tier,
      userId,
      amount: plans[tier].price,
      currency: 'usd',
      status: 'pending',
      // In production, this would be the payment provider's checkout URL
      checkoutUrl: `/checkout?session=${Date.now()}&tier=${tier}`,
    };

    logger.info('[SubscriptionController] Checkout session created', {
      userId,
      tier,
      sessionId: checkoutSession.id,
    });

    res.json({ session: checkoutSession });
  } catch (error) {
    logger.error('[SubscriptionController] Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

/**
 * Handle payment webhook (placeholder for payment provider webhook)
 */
const handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // TODO: Verify webhook signature from payment provider

    if (event === 'payment.succeeded') {
      const { userId, tier } = data;
      
      // Activate subscription
      await activateSubscription(userId, tier);

      logger.info('[SubscriptionController] Payment succeeded, subscription activated', {
        userId,
        tier,
      });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[SubscriptionController] Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Cancel subscription
 */
const cancelUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await cancelSubscription(userId);

    res.json({ 
      message: 'Subscription cancelled successfully',
      subscription: await checkUserSubscription(userId),
    });
  } catch (error) {
    logger.error('[SubscriptionController] Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Activate subscription (for testing/admin purposes)
 */
const activateUserSubscription = async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;

    // In production, this should be admin-only or removed
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    await activateSubscription(userId, tier);

    res.json({ 
      message: 'Subscription activated successfully',
      subscription: await checkUserSubscription(userId),
    });
  } catch (error) {
    logger.error('[SubscriptionController] Error activating subscription:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
};

module.exports = {
  getPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  handleWebhook,
  cancelUserSubscription,
  activateUserSubscription,
};
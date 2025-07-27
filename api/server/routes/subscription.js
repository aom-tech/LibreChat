const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware/auth');
const {
  getPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  handleWebhook,
  cancelUserSubscription,
  activateUserSubscription,
} = require('~/server/controllers/SubscriptionController');

// Public routes
router.get('/plans', getPlans);

// Webhook route (no auth required, but should verify signature)
router.post('/webhook', handleWebhook);

// Protected routes
router.get('/status', requireJwtAuth, getSubscriptionStatus);
router.post('/checkout', requireJwtAuth, createCheckoutSession);
router.post('/cancel', requireJwtAuth, cancelUserSubscription);

// Development/testing route
if (process.env.NODE_ENV !== 'production') {
  router.post('/activate', requireJwtAuth, activateUserSubscription);
}

module.exports = router;
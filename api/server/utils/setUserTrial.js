const axios = require('axios');
const { logger } = require('~/config');

/**
 * Sets trial subscription for a user
 * @param {string} userId - The user ID to set trial for
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function setUserTrial(userId) {
  try {
    const billingUrl = process.env.BILLING_URL;

    if (!billingUrl) {
      logger.warn('[setUserTrial] BILLING_URL not configured in environment variables');
      return false;
    }

    const response = await axios.post(
      `${billingUrl}/api/v1/billing/set-trial`,
      { userId },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.status === 200 || response.status === 201) {
      logger.info(`[setUserTrial] Trial subscription set successfully for user: ${userId}`);
      return true;
    }

    logger.warn(`[setUserTrial] Unexpected response status: ${response.status} for user: ${userId}`);
    return false;
  } catch (error) {
    logger.error(`[setUserTrial] Error setting trial for user ${userId}, billingUrl ${billingUrl}:`, error);
    return false;
  }
}

module.exports = setUserTrial;

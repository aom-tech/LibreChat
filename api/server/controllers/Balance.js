const { Balance } = require('~/db/models');
const { FIXED_SERVICE_COSTS } = require('../../models/tx');

async function balanceController(req, res) {
  const balanceData = await Balance.findOne(
    { user: req.user.id },
    '-_id tokenCredits availableCredits autoRefillEnabled refillIntervalValue refillIntervalUnit lastRefill refillAmount',
  ).lean();

  if (!balanceData) {
    return res.status(404).json({ error: 'Balance not found' });
  }

  // If auto-refill is not enabled, remove auto-refill related fields from the response
  if (!balanceData.autoRefillEnabled) {
    delete balanceData.refillIntervalValue;
    delete balanceData.refillIntervalUnit;
    delete balanceData.lastRefill;
    delete balanceData.refillAmount;
  }

  // console.log('balance: ',)

  if (balanceData.availableCredits) {
    balanceData.availableCredits.image =
      balanceData.availableCredits.image / FIXED_SERVICE_COSTS.IMAGE;

    balanceData.availableCredits.presentation =
      balanceData.availableCredits.presentation / FIXED_SERVICE_COSTS.PRESENTATION;

    balanceData.availableCredits.video =
      balanceData.availableCredits.video /
      (FIXED_SERVICE_COSTS.DEFAULT_VIDEO_DURATION_SEC * FIXED_SERVICE_COSTS.VIDEO);
  }

  res.status(200).json(balanceData);
}

module.exports = balanceController;

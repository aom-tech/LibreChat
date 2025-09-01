const { logger } = require('@librechat/data-schemas');
const { getBalanceConfig } = require('~/server/services/Config');
const { getMultiplier, getCacheMultiplier } = require('./tx');
const { Transaction, Balance } = require('~/db/models');

const cancelRate = 1.15;

/**
 * Updates a user's token balance based on a transaction using optimistic concurrency control
 * without schema changes. Compatible with DocumentDB.
 * @async
 * @function
 * @param {Object} params - The function parameters.
 * @param {string|mongoose.Types.ObjectId} params.user - The user ID.
 * @param {number} params.incrementValue - The value to increment the balance by (can be negative).
 * @param {import('mongoose').UpdateQuery<import('@librechat/data-schemas').IBalance>['$set']} [params.setValues] - Optional additional fields to set.
 * @param {'text' | 'image' | 'presentation' | 'video' | null} [params.creditType] - The credit type to update.
 * @returns {Promise<Object>} Returns the updated balance document (lean).
 * @throws {Error} Throws an error if the update fails after multiple retries.
 */
const updateBalance = async ({ user, incrementValue, setValues, creditType = null }) => {
  let maxRetries = 10; // Number of times to retry on conflict
  let delay = 50; // Initial retry delay in ms
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let currentBalanceDoc;
    try {
      // 1. Read the current document state
      currentBalanceDoc = await Balance.findOne({ user }).lean();

      let currentCredits;
      let newCredits;
      let updatePayload;

      if (creditType) {
        // Handle specific credit type (including 'text')
        const currentAvailableCredits = currentBalanceDoc?.availableCredits || {
          text: 0,
          image: 0,
          presentation: 0,
          video: 0,
        };
        currentCredits = currentAvailableCredits[creditType] || 0;
        const potentialNewCredits = currentCredits + incrementValue;
        newCredits = Math.max(0, potentialNewCredits);

        const updatedAvailableCredits = {
          ...currentAvailableCredits,
          [creditType]: newCredits,
        };

        updatePayload = {
          $set: {
            availableCredits: updatedAvailableCredits,
            ...(setValues || {}),
          },
        };
      } else {
        // Handle legacy tokenCredits (when no creditType is specified)
        currentCredits = currentBalanceDoc ? currentBalanceDoc.tokenCredits : 0;
        const potentialNewCredits = currentCredits + incrementValue;
        newCredits = Math.max(0, potentialNewCredits);

        updatePayload = {
          $set: {
            tokenCredits: newCredits,
            ...(setValues || {}),
          },
        };
      }

      // 4. Attempt the conditional update or upsert
      let updatedBalance = null;
      if (currentBalanceDoc) {
        // --- Document Exists: Perform Conditional Update ---
        // Build the query based on credit type
        let query = { user: user };
        if (creditType) {
          // For specific credit types (including 'text'), we need to check the nested field
          query[`availableCredits.${creditType}`] = currentCredits;
        } else {
          // For legacy tokenCredits
          query.tokenCredits = currentCredits;
        }

        updatedBalance = await Balance.findOneAndUpdate(query, updatePayload, {
          new: true, // Return the modified document
          // lean: true, // .lean() is applied after query execution in Mongoose >= 6
        }).lean(); // Use lean() for plain JS object

        if (updatedBalance) {
          // Success! The update was applied based on the expected current state.
          return updatedBalance;
        }
        // If updatedBalance is null, it means tokenCredits changed between read and write (conflict).
        lastError = new Error(`Concurrency conflict for user ${user} on attempt ${attempt}.`);
        // Proceed to retry logic below.
      } else {
        // --- Document Does Not Exist: Perform Conditional Upsert ---
        // Try to insert the document, but only if it still doesn't exist.
        // Using tokenCredits: {$exists: false} helps prevent race conditions where
        // another process creates the doc between our findOne and findOneAndUpdate.
        try {
          updatedBalance = await Balance.findOneAndUpdate(
            {
              user: user,
              // Attempt to match only if the document doesn't exist OR was just created
              // without tokenCredits (less likely but possible). A simple { user } filter
              // might also work, relying on the retry for conflicts.
              // Let's use a simpler filter and rely on retry for races.
              // tokenCredits: { $exists: false } // This condition might be too strict if doc exists with 0 credits
            },
            updatePayload,
            {
              upsert: true, // Create if doesn't exist
              new: true, // Return the created/updated document
              // setDefaultsOnInsert: true, // Ensure schema defaults are applied on insert
              // lean: true,
            },
          ).lean();

          if (updatedBalance) {
            // Upsert succeeded (likely created the document)
            return updatedBalance;
          }
          // If null, potentially a rare race condition during upsert. Retry should handle it.
          lastError = new Error(
            `Upsert race condition suspected for user ${user} on attempt ${attempt}.`,
          );
        } catch (error) {
          if (error.code === 11000) {
            // E11000 duplicate key error on index
            // This means another process created the document *just* before our upsert.
            // It's a concurrency conflict during creation. We should retry.
            lastError = error; // Store the error
            // Proceed to retry logic below.
          } else {
            // Different error, rethrow
            throw error;
          }
        }
      } // End if/else (document exists?)
    } catch (error) {
      // Catch errors from findOne or unexpected findOneAndUpdate errors
      logger.error(`[updateBalance] Error during attempt ${attempt} for user ${user}:`, error);
      lastError = error; // Store the error
      // Consider stopping retries for non-transient errors, but for now, we retry.
    }

    // If we reached here, it means the update failed (conflict or error), wait and retry
    if (attempt < maxRetries) {
      const jitter = Math.random() * delay * 0.5; // Add jitter to delay
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      delay = Math.min(delay * 2, 2000); // Exponential backoff with cap
    }
  } // End for loop (retries)

  // If loop finishes without success, throw the last encountered error or a generic one
  logger.error(
    `[updateBalance] Failed to update balance for user ${user} after ${maxRetries} attempts.`,
  );
  throw (
    lastError ||
    new Error(
      `Failed to update balance for user ${user} after maximum retries due to persistent conflicts.`,
    )
  );
};

/** Method to calculate and set the tokenValue for a transaction */
function calculateTokenValue(txn) {
  if (!txn.valueKey || !txn.tokenType) {
    txn.tokenValue = txn.rawAmount;
  }
  const { valueKey, tokenType, model, endpointTokenConfig } = txn;
  const multiplier = Math.abs(getMultiplier({ valueKey, tokenType, model, endpointTokenConfig }));
  txn.rate = multiplier;
  txn.tokenValue = txn.rawAmount * multiplier;
  if (txn.context && txn.tokenType === 'completion' && txn.context === 'incomplete') {
    txn.tokenValue = Math.ceil(txn.tokenValue * cancelRate);
    txn.rate *= cancelRate;
  }
}

/**
 * New static method to create an auto-refill transaction that does NOT trigger a balance update.
 * @param {object} txData - Transaction data.
 * @param {string} txData.user - The user ID.
 * @param {string} txData.tokenType - The type of token.
 * @param {string} txData.context - The context of the transaction.
 * @param {number} txData.rawAmount - The raw amount of tokens.
 * @returns {Promise<object>} - The created transaction.
 */
async function createAutoRefillTransaction(txData) {
  if (txData.rawAmount != null && isNaN(txData.rawAmount)) {
    return;
  }
  const transaction = new Transaction(txData);
  transaction.endpointTokenConfig = txData.endpointTokenConfig;
  calculateTokenValue(transaction);
  await transaction.save();

  const balanceResponse = await updateBalance({
    user: transaction.user,
    incrementValue: txData.rawAmount,
    setValues: { lastRefill: new Date() },
    creditType: 'text', // Auto-refill always applies to text credits
  });
  const result = {
    rate: transaction.rate,
    user: transaction.user.toString(),
    balance: balanceResponse.availableCredits?.text ?? balanceResponse.tokenCredits ?? 0,
  };
  logger.debug('[Balance.check] Auto-refill performed', result);
  result.transaction = transaction;
  return result;
}

/**
 * Static method to create a transaction and update the balance
 * @param {txData} txData - Transaction data.
 */
async function createTransaction(txData) {
  if (txData.rawAmount != null && isNaN(txData.rawAmount)) {
    return;
  }

  const transaction = new Transaction(txData);
  transaction.endpointTokenConfig = txData.endpointTokenConfig;
  calculateTokenValue(transaction);

  await transaction.save();

  const balance = await getBalanceConfig();
  if (!balance?.enabled) {
    return;
  }

  let incrementValue = transaction.tokenValue;
  // Use provided creditType (for Flux) or default to text
  const creditType = txData.creditType || 'text';

  const balanceResponse = await updateBalance({
    user: transaction.user,
    incrementValue,
    creditType,
  });

  const responseBalance = creditType
    ? balanceResponse.availableCredits?.[creditType] || 0
    : balanceResponse.tokenCredits;

  return {
    rate: transaction.rate,
    user: transaction.user.toString(),
    balance: responseBalance,
    creditType,
    [transaction.tokenType]: incrementValue,
  };
}

/**
 * Static method to create a structured transaction and update the balance
 * @param {txData} txData - Transaction data.
 */
async function createStructuredTransaction(txData) {
  const transaction = new Transaction({
    ...txData,
    endpointTokenConfig: txData.endpointTokenConfig,
  });

  calculateStructuredTokenValue(transaction);

  await transaction.save();

  const balance = await getBalanceConfig();
  if (!balance?.enabled) {
    return;
  }

  let incrementValue = transaction.tokenValue;
  // Use provided creditType (for Flux) or default to text
  const creditType = txData.creditType || 'text';

  const balanceResponse = await updateBalance({
    user: transaction.user,
    incrementValue,
    creditType,
  });

  const responseBalance = creditType
    ? balanceResponse.availableCredits?.[creditType] || 0
    : balanceResponse.tokenCredits;

  return {
    rate: transaction.rate,
    user: transaction.user.toString(),
    balance: responseBalance,
    creditType,
    [transaction.tokenType]: incrementValue,
  };
}

/** Method to calculate token value for structured tokens */
function calculateStructuredTokenValue(txn) {
  if (!txn.tokenType) {
    txn.tokenValue = txn.rawAmount;
    return;
  }

  const { model, endpointTokenConfig } = txn;

  if (txn.tokenType === 'prompt') {
    const inputMultiplier = getMultiplier({ tokenType: 'prompt', model, endpointTokenConfig });
    const writeMultiplier =
      getCacheMultiplier({ cacheType: 'write', model, endpointTokenConfig }) ?? inputMultiplier;
    const readMultiplier =
      getCacheMultiplier({ cacheType: 'read', model, endpointTokenConfig }) ?? inputMultiplier;

    txn.rateDetail = {
      input: inputMultiplier,
      write: writeMultiplier,
      read: readMultiplier,
    };

    const totalPromptTokens =
      Math.abs(txn.inputTokens || 0) +
      Math.abs(txn.writeTokens || 0) +
      Math.abs(txn.readTokens || 0);

    if (totalPromptTokens > 0) {
      txn.rate =
        (Math.abs(inputMultiplier * (txn.inputTokens || 0)) +
          Math.abs(writeMultiplier * (txn.writeTokens || 0)) +
          Math.abs(readMultiplier * (txn.readTokens || 0))) /
        totalPromptTokens;
    } else {
      txn.rate = Math.abs(inputMultiplier); // Default to input rate if no tokens
    }

    txn.tokenValue = -(
      Math.abs(txn.inputTokens || 0) * inputMultiplier +
      Math.abs(txn.writeTokens || 0) * writeMultiplier +
      Math.abs(txn.readTokens || 0) * readMultiplier
    );

    txn.rawAmount = -totalPromptTokens;
  } else if (txn.tokenType === 'completion') {
    const multiplier = getMultiplier({ tokenType: txn.tokenType, model, endpointTokenConfig });
    txn.rate = Math.abs(multiplier);
    txn.tokenValue = -Math.abs(txn.rawAmount) * multiplier;
    txn.rawAmount = -Math.abs(txn.rawAmount);
  }

  if (txn.context && txn.tokenType === 'completion' && txn.context === 'incomplete') {
    txn.tokenValue = Math.ceil(txn.tokenValue * cancelRate);
    txn.rate *= cancelRate;
    if (txn.rateDetail) {
      txn.rateDetail = Object.fromEntries(
        Object.entries(txn.rateDetail).map(([k, v]) => [k, v * cancelRate]),
      );
    }
  }
}

/**
 * Queries and retrieves transactions based on a given filter.
 * @async
 * @function getTransactions
 * @param {Object} filter - MongoDB filter object to apply when querying transactions.
 * @returns {Promise<Array>} A promise that resolves to an array of matched transactions.
 * @throws {Error} Throws an error if querying the database fails.
 */
async function getTransactions(filter) {
  try {
    return await Transaction.find(filter).lean();
  } catch (error) {
    logger.error('Error querying transactions:', error);
    throw error;
  }
}

module.exports = {
  getTransactions,
  createTransaction,
  createAutoRefillTransaction,
  createStructuredTransaction,
};

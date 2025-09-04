const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Compares the provided password with the user's password.
 *
 * @param {MongoUser} user - The user to compare the password for.
 * @param {string} candidatePassword - The password to test against the user's password.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the password matches.
 */
const comparePassword = async (user, candidatePassword) => {
  if (!user) {
    throw new Error('No user provided');
  }

  if (!user.password) {
    throw new Error('No password, likely an email first registered via Social/OIDC login');
  }

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        reject(err);
      }
      resolve(isMatch);
    });
  });
};

/**
 * Generates a unique referral code for a user.
 *
 * @returns {string} A unique 8-character alphanumeric referral code.
 */
const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let code = '';

  const randomBytes = crypto.randomBytes(codeLength);

  for (let i = 0; i < codeLength; i++) {
    code += characters[randomBytes[i] % characters.length];
  }

  return code;
};

module.exports = {
  comparePassword,
  generateReferralCode,
};

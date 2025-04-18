// src/utils/tokenCleanup.js
const { cleanupExpiredTokens } = require('../middlewares/tokenRefreshMiddleware');

/**
 * Mengatur interval untuk membersihkan refresh token yang kadaluarsa
 * @param {Number} intervalInHours - Interval dalam jam (default: 24 jam)
 */
const setupTokenCleanup = (intervalInHours = 24) => {
  // Jalankan sekali saat startup
  cleanupExpiredTokens();
  
  // Set interval untuk membersihkan token kadaluarsa secara berkala
  const intervalInMs = intervalInHours * 60 * 60 * 1000;
  setInterval(cleanupExpiredTokens, intervalInMs);
  
  console.log(`Token cleanup scheduled every ${intervalInHours} hours`);
};

module.exports = {
  setupTokenCleanup
};
// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Membuat access token JWT
 * @param {Object} payload - Data yang akan disimpan dalam token
 * @returns {String} - Access Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
  });
};

/**
 * Membuat refresh token
 * @returns {String} - Random refresh token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Memverifikasi access token JWT
 * @param {String} token - Access Token JWT
 * @returns {Object|null} - Payload token jika valid atau null jika tidak valid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Mendapatkan timestamp expiry untuk refresh token
 * @returns {Date} - Timestamp expiry
 */
const getRefreshTokenExpiry = () => {
  const expiresInSeconds = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) * 24 * 60 * 60;
  return new Date(Date.now() + expiresInSeconds * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getRefreshTokenExpiry
};
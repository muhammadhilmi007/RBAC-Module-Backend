// src/utils/jwt.js
const jwt = require('jsonwebtoken');

/**
 * Membuat token JWT
 * @param {Object} payload - Data yang akan disimpan dalam token
 * @returns {String} - Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 * Memverifikasi token JWT
 * @param {String} token - Token JWT
 * @returns {Object|null} - Payload token jika valid atau null jika tidak valid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
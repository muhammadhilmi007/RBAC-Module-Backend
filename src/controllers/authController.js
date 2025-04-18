// src/controllers/authController.js
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Validasi untuk endpoint login
 */
const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password tidak boleh kosong')
];

/**
 * Controller untuk login
 */
const login = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set refresh token dalam cookie http-only
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000
  });

  return res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * Controller untuk refresh token
 */
const refreshToken = catchAsync(async (req, res) => {
  // Ambil refresh token dari cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token tidak tersedia'
    });
  }

  const result = await authService.refreshToken(refreshToken);

  // Set refresh token baru dalam cookie http-only
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000
  });

  return res.json({
    success: true,
    message: 'Token berhasil diperbarui',
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * Controller untuk logout
 */
const logout = catchAsync(async (req, res) => {
  // Ambil refresh token dari cookie
  const refreshToken = req.cookies.refreshToken;
  
  // Revoke refresh token
  await authService.logout(refreshToken);

  // Hapus cookie refresh token
  res.clearCookie('refreshToken');

  return res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

/**
 * Controller untuk mendapatkan profile user
 */
const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const profile = await authService.getProfile(userId);

  return res.json({
    success: true,
    data: profile
  });
});

module.exports = {
  loginValidation,
  login,
  refreshToken,
  logout,
  getProfile
};
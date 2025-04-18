// src/controllers/authController.js
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');

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
const login = async (req, res) => {
  try {
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

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login gagal'
    });
  }
};

/**
 * Controller untuk mendapatkan profile user
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await authService.getProfile(userId);

    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(404).json({
      success: false,
      message: error.message || 'Gagal mendapatkan profile'
    });
  }
};

module.exports = {
  loginValidation,
  login,
  getProfile
};
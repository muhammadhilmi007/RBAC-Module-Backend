// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateRefreshToken, trackRefreshToken } = require('../middlewares/tokenRefreshMiddleware');

const router = express.Router();

// Track refresh token untuk semua routes (opsional)
router.use(trackRefreshToken);

// Route untuk login
router.post('/login', authController.loginValidation, authController.login);

// Route untuk refresh token (memerlukan validasi refresh token)
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

// Route untuk logout
router.post('/logout', authController.logout);

// Route untuk mendapatkan profile (memerlukan autentikasi)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
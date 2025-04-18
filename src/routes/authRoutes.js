// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route untuk login
router.post('/login', authController.loginValidation, authController.login);

// Route untuk mendapatkan profile (memerlukan autentikasi)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
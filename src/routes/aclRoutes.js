// src/routes/aclRoutes.js
const express = require('express');
const aclController = require('../controllers/aclController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan akses user berdasarkan roleId
router.get('/access', aclController.getUserAccess);

// Route untuk memeriksa apakah user memiliki akses ke fitur dan permission tertentu
router.post('/check', aclController.checkAccess);

// Route untuk mendapatkan semua fitur
router.get('/features', aclController.getAllFeatures);

// Route untuk mendapatkan semua permission
router.get('/permissions', aclController.getAllPermissions);

module.exports = router;
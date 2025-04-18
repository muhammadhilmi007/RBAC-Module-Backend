// src/routes/featureRoutes.js
const express = require('express');
const featureController = require('../controllers/featureController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Get all features - dapat diakses oleh semua user yang terautentikasi
router.get('/', featureController.getAllFeatures);

// Get feature by ID - dapat diakses oleh semua user yang terautentikasi
router.get('/:id', featureController.getFeatureById);

// Create feature - memerlukan akses Create pada Pengaturan
router.post(
  '/',
  checkAccess('Pengaturan', 'Create'),
  featureController.featureValidation,
  featureController.createFeature
);

// Update feature - memerlukan akses Edit pada Pengaturan
router.put(
  '/:id',
  checkAccess('Pengaturan', 'Edit'),
  featureController.featureValidation,
  featureController.updateFeature
);

// Delete feature - memerlukan akses Delete pada Pengaturan
router.delete(
  '/:id',
  checkAccess('Pengaturan', 'Delete'),
  featureController.deleteFeature
);

module.exports = router;
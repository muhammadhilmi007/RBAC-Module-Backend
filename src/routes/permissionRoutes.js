// src/routes/permissionRoutes.js
const express = require('express');
const permissionController = require('../controllers/permissionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Get all permissions - dapat diakses oleh semua user yang terautentikasi
router.get('/', permissionController.getAllPermissions);

// Get permission by ID - dapat diakses oleh semua user yang terautentikasi
router.get('/:id', permissionController.getPermissionById);

// Create permission - memerlukan akses Create pada Pengaturan
router.post(
  '/',
  checkAccess('Pengaturan', 'Create'),
  permissionController.permissionValidation,
  permissionController.createPermission
);

// Update permission - memerlukan akses Edit pada Pengaturan
router.put(
  '/:id',
  checkAccess('Pengaturan', 'Edit'),
  permissionController.permissionValidation,
  permissionController.updatePermission
);

// Delete permission - memerlukan akses Delete pada Pengaturan
router.delete(
  '/:id',
  checkAccess('Pengaturan', 'Delete'),
  permissionController.deletePermission
);

module.exports = router;
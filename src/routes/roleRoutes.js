// src/routes/roleRoutes.js
const express = require('express');
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Get all roles - memerlukan akses View pada Pengaturan
router.get(
  '/',
  checkAccess('Pengaturan', 'View'),
  roleController.getAllRoles
);

// Get role by ID - memerlukan akses View pada Pengaturan
router.get(
  '/:id',
  checkAccess('Pengaturan', 'View'),
  roleController.getRoleById
);

// Create role - memerlukan akses Create pada Pengaturan
router.post(
  '/',
  checkAccess('Pengaturan', 'Create'),
  roleController.roleValidation,
  roleController.createRole
);

// Update role - memerlukan akses Edit pada Pengaturan
router.put(
  '/:id',
  checkAccess('Pengaturan', 'Edit'),
  roleController.roleValidation,
  roleController.updateRole
);

// Delete role - memerlukan akses Delete pada Pengaturan
router.delete(
  '/:id',
  checkAccess('Pengaturan', 'Delete'),
  roleController.deleteRole
);

// Add permission to role - memerlukan akses Edit pada Pengaturan
router.post(
  '/permission/add',
  checkAccess('Pengaturan', 'Edit'),
  roleController.addRolePermission
);

// Remove permission from role - memerlukan akses Edit pada Pengaturan
router.post(
  '/permission/remove',
  checkAccess('Pengaturan', 'Edit'),
  roleController.removeRolePermission
);

module.exports = router;
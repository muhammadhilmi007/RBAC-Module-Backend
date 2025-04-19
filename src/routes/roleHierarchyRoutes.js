// src/routes/roleHierarchyRoutes.js
const express = require('express');
const roleHierarchyController = require('../controllers/roleHierarchyController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Get role hierarchy - memerlukan akses View pada Pengaturan
router.get(
  '/hierarchy',
  checkAccess('Pengaturan', 'View'),
  roleHierarchyController.getRoleHierarchy
);

// Get all permissions for a role (including inherited) - memerlukan akses View pada Pengaturan
router.get(
  '/:roleId/permissions',
  checkAccess('Pengaturan', 'View'),
  roleHierarchyController.getAllRolePermissions
);

// Update parent role - memerlukan akses Edit pada Pengaturan
router.put(
  '/:id/parent',
  checkAccess('Pengaturan', 'Edit'),
  roleHierarchyController.updateParentRole
);

// Grant full access to a role - memerlukan akses Edit pada Pengaturan
router.post(
  '/:roleId/grant-full-access',
  checkAccess('Pengaturan', 'Edit'),
  roleHierarchyController.grantFullAccess
);

// Copy permissions from one role to another - memerlukan akses Edit pada Pengaturan
router.post(
  '/copy-permissions',
  checkAccess('Pengaturan', 'Edit'),
  roleHierarchyController.copyPermissions
);

module.exports = router;
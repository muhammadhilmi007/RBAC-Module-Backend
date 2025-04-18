// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Get all users - memerlukan akses View pada Manajemen Pengguna
router.get(
  '/',
  checkAccess('Manajemen Pengguna', 'View'),
  userController.getAllUsers
);

// Get user by ID - memerlukan akses View pada Manajemen Pengguna
router.get(
  '/:id',
  checkAccess('Manajemen Pengguna', 'View'),
  userController.getUserById
);

// Create user - memerlukan akses Create pada Manajemen Pengguna
router.post(
  '/',
  checkAccess('Manajemen Pengguna', 'Create'),
  userController.createUserValidation,
  userController.createUser
);

// Update user - memerlukan akses Edit pada Manajemen Pengguna
router.put(
  '/:id',
  checkAccess('Manajemen Pengguna', 'Edit'),
  userController.updateUserValidation,
  userController.updateUser
);

// Delete user - memerlukan akses Delete pada Manajemen Pengguna
router.delete(
  '/:id',
  checkAccess('Manajemen Pengguna', 'Delete'),
  userController.deleteUser
);

// Change password untuk user sendiri - tidak memerlukan permission tambahan
router.post(
  '/change-password',
  userController.changePasswordValidation,
  userController.changePassword
);

module.exports = router;
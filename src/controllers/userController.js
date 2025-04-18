// src/controllers/userController.js
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const auditService = require('../services/auditService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Validasi untuk endpoint create user
 */
const createUserValidation = [
  body('name').notEmpty().withMessage('Nama tidak boleh kosong'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('roleId').isInt().withMessage('Role ID harus berupa angka')
];

/**
 * Validasi untuk endpoint update user
 */
const updateUserValidation = [
  body('name').optional().notEmpty().withMessage('Nama tidak boleh kosong'),
  body('email').optional().isEmail().withMessage('Email tidak valid'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('roleId').optional().isInt().withMessage('Role ID harus berupa angka')
];

/**
 * Validasi untuk endpoint change password
 */
const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Password lama tidak boleh kosong'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
];

/**
 * Controller untuk mendapatkan semua user
 */
const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();

  // Catat aktivitas mengakses daftar user
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'USER',
    description: 'Mengakses daftar pengguna'
  }).catch(err => console.error('Error logging get all users activity:', err));

  return res.json({
    success: true,
    data: users
  });
});

/**
 * Controller untuk mendapatkan user berdasarkan ID
 */
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  // Catat aktivitas melihat detail user
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'USER',
    description: `Melihat detail pengguna dengan ID ${id}`,
    resourceId: id
  }).catch(err => console.error('Error logging get user by id activity:', err));

  return res.json({
    success: true,
    data: user
  });
});

/**
 * Controller untuk membuat user baru
 */
const createUser = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userData = req.body;
  const user = await userService.createUser(userData);

  // Catat aktivitas pembuatan user
  auditService.logActivity({
    userId: req.user.id,
    action: 'CREATE',
    module: 'USER',
    description: `Membuat pengguna baru: ${user.name} (${user.email})`,
    resourceId: user.id,
    newValues: {
      name: user.name,
      email: user.email,
      roleId: user.roleId
    }
  }).catch(err => console.error('Error logging create user activity:', err));

  return res.status(201).json({
    success: true,
    message: 'User berhasil dibuat',
    data: user
  });
});

/**
 * Controller untuk mengupdate user
 */
const updateUser = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const userData = req.body;
  
  // Ambil data lama untuk audit trail
  const oldUserData = await userService.getUserById(id);
  
  // Update user
  const user = await userService.updateUser(id, userData);

  // Catat aktivitas update user
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'USER',
    description: `Mengupdate pengguna: ${user.name} (${user.email})`,
    resourceId: user.id,
    oldValues: {
      name: oldUserData.name,
      email: oldUserData.email,
      roleId: oldUserData.roleId
    },
    newValues: {
      name: user.name,
      email: user.email,
      roleId: user.roleId
    }
  }).catch(err => console.error('Error logging update user activity:', err));

  return res.json({
    success: true,
    message: 'User berhasil diupdate',
    data: user
  });
});

/**
 * Controller untuk menghapus user
 */
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Ambil data user sebelum dihapus untuk audit trail
  const userToDelete = await userService.getUserById(id);
  
  // Hapus user
  await userService.deleteUser(id);

  // Catat aktivitas penghapusan user
  auditService.logActivity({
    userId: req.user.id,
    action: 'DELETE',
    module: 'USER',
    description: `Menghapus pengguna: ${userToDelete.name} (${userToDelete.email})`,
    resourceId: id,
    oldValues: {
      name: userToDelete.name,
      email: userToDelete.email,
      roleId: userToDelete.roleId
    }
  }).catch(err => console.error('Error logging delete user activity:', err));

  return res.json({
    success: true,
    message: 'User berhasil dihapus'
  });
});

/**
 * Controller untuk mengubah password user
 */
const changePassword = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;
  await userService.changePassword(userId, oldPassword, newPassword);

  // Catat aktivitas perubahan password
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'USER',
    description: 'User mengubah password',
    resourceId: userId
  }).catch(err => console.error('Error logging change password activity:', err));

  return res.json({
    success: true,
    message: 'Password berhasil diubah'
  });
});

module.exports = {
  createUserValidation,
  updateUserValidation,
  changePasswordValidation,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
};
// src/controllers/userController.js
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
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
  const user = await userService.updateUser(id, userData);

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
  await userService.deleteUser(id);

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
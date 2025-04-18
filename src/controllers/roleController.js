// src/controllers/roleController.js
const { body, validationResult } = require('express-validator');
const roleService = require('../services/roleService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Validasi untuk endpoint create dan update role
 */
const roleValidation = [
  body('name').notEmpty().withMessage('Nama role tidak boleh kosong')
];

/**
 * Controller untuk mendapatkan semua role
 */
const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();

  return res.json({
    success: true,
    data: roles
  });
});

/**
 * Controller untuk mendapatkan role berdasarkan ID
 */
const getRoleById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const role = await roleService.getRoleById(id);

  return res.json({
    success: true,
    data: role
  });
});

/**
 * Controller untuk membuat role baru
 */
const createRole = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name } = req.body;
  const role = await roleService.createRole(name);

  return res.status(201).json({
    success: true,
    message: 'Role berhasil dibuat',
    data: role
  });
});

/**
 * Controller untuk mengupdate role
 */
const updateRole = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { name } = req.body;
  const role = await roleService.updateRole(id, name);

  return res.json({
    success: true,
    message: 'Role berhasil diupdate',
    data: role
  });
});

/**
 * Controller untuk menghapus role
 */
const deleteRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  await roleService.deleteRole(id);

  return res.json({
    success: true,
    message: 'Role berhasil dihapus'
  });
});

/**
 * Controller untuk menambahkan permission ke role
 */
const addRolePermission = catchAsync(async (req, res) => {
  const { roleId, featureId, permissionId } = req.body;

  if (!roleId || !featureId || !permissionId) {
    return res.status(400).json({
      success: false,
      message: 'roleId, featureId, dan permissionId diperlukan'
    });
  }

  const acl = await roleService.addRolePermission(roleId, featureId, permissionId);

  return res.status(201).json({
    success: true,
    message: 'Permission berhasil ditambahkan ke role',
    data: acl
  });
});

/**
 * Controller untuk menghapus permission dari role
 */
const removeRolePermission = catchAsync(async (req, res) => {
  const { roleId, featureId, permissionId } = req.body;

  if (!roleId || !featureId || !permissionId) {
    return res.status(400).json({
      success: false,
      message: 'roleId, featureId, dan permissionId diperlukan'
    });
  }

  await roleService.removeRolePermission(roleId, featureId, permissionId);

  return res.json({
    success: true,
    message: 'Permission berhasil dihapus dari role'
  });
});

module.exports = {
  roleValidation,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  addRolePermission,
  removeRolePermission
};
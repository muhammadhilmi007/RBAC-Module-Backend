// src/controllers/roleController.js
const { body, validationResult } = require('express-validator');
const roleService = require('../services/roleService');
const auditService = require('../services/auditService');
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

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'ROLE',
    description: 'Mengakses daftar role'
  }).catch(err => console.error('Error logging get all roles activity:', err));

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

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'ROLE',
    description: `Melihat detail role dengan ID ${id}`,
    resourceId: id
  }).catch(err => console.error('Error logging get role by id activity:', err));

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

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'CREATE',
    module: 'ROLE',
    description: `Membuat role baru: ${role.name}`,
    resourceId: role.id,
    newValues: { name: role.name }
  }).catch(err => console.error('Error logging create role activity:', err));

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
  
  // Ambil data lama untuk audit trail
  const oldRole = await roleService.getRoleById(id);
  
  const role = await roleService.updateRole(id, name);

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'ROLE',
    description: `Mengupdate role: ${role.name}`,
    resourceId: role.id,
    oldValues: { name: oldRole.name },
    newValues: { name: role.name }
  }).catch(err => console.error('Error logging update role activity:', err));

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
  
  // Ambil data role sebelum dihapus untuk audit trail
  const roleToDelete = await roleService.getRoleById(id);
  
  await roleService.deleteRole(id);

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'DELETE',
    module: 'ROLE',
    description: `Menghapus role: ${roleToDelete.name}`,
    resourceId: id,
    oldValues: { name: roleToDelete.name }
  }).catch(err => console.error('Error logging delete role activity:', err));

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

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'CREATE',
    module: 'ACL',
    description: `Menambahkan permission ke role dengan ID ${roleId}`,
    resourceId: acl.id,
    newValues: { roleId, featureId, permissionId }
  }).catch(err => console.error('Error logging add role permission activity:', err));

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

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'DELETE',
    module: 'ACL',
    description: `Menghapus permission dari role dengan ID ${roleId}`,
    oldValues: { roleId, featureId, permissionId }
  }).catch(err => console.error('Error logging remove role permission activity:', err));

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
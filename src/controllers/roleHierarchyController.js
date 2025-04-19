// src/controllers/roleHierarchyController.js
const roleService = require('../services/roleService');
const aclService = require('../services/aclService');
const auditService = require('../services/auditService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Controller untuk mendapatkan hierarki role
 */
const getRoleHierarchy = catchAsync(async (req, res) => {
  const hierarchy = await roleService.getRoleHierarchy();

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'ROLE',
    description: 'Mengakses hierarki role'
  }).catch(err => console.error('Error logging get role hierarchy activity:', err));

  return res.json({
    success: true,
    data: hierarchy
  });
});

/**
 * Controller untuk mendapatkan semua permission role (termasuk yang diwarisi)
 */
const getAllRolePermissions = catchAsync(async (req, res) => {
  const { roleId } = req.params;
  const permissions = await roleService.getAllRolePermissions(roleId);

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'READ',
    module: 'ROLE',
    description: `Melihat semua permission untuk role ID ${roleId}`,
    resourceId: roleId
  }).catch(err => console.error('Error logging get all role permissions activity:', err));

  return res.json({
    success: true,
    data: permissions
  });
});

/**
 * Controller untuk mengubah parent role
 */
const updateParentRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { parentRoleId } = req.body;

  // Update parent role
  const updatedRole = await roleService.updateRole(id, { parentRoleId });

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'ROLE',
    description: `Mengubah parent role untuk role ID ${id} menjadi ${parentRoleId || 'null'}`,
    resourceId: id,
    oldValues: { parentRoleId: null }, // Tidak lengkap, tapi untuk logging saja
    newValues: { parentRoleId }
  }).catch(err => console.error('Error logging update parent role activity:', err));

  return res.json({
    success: true,
    message: 'Parent role berhasil diubah',
    data: updatedRole
  });
});

/**
 * Controller untuk memberikan akses penuh pada semua fitur
 */
const grantFullAccess = catchAsync(async (req, res) => {
  const { roleId } = req.params;
  
  // Cek apakah role valid
  const role = await roleService.getRoleById(roleId);
  
  // Berikan akses penuh
  const addedCount = await aclService.grantFullAccess(roleId);

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'ROLE',
    description: `Memberikan akses penuh untuk role: ${role.name}`,
    resourceId: roleId
  }).catch(err => console.error('Error logging grant full access activity:', err));

  return res.json({
    success: true,
    message: `Berhasil menambahkan ${addedCount} permission ke role`,
    data: { addedCount }
  });
});

/**
 * Controller untuk menyalin permission dari satu role ke role lainnya
 */
const copyPermissions = catchAsync(async (req, res) => {
  const { sourceRoleId, targetRoleId } = req.body;
  
  if (!sourceRoleId || !targetRoleId) {
    return res.status(400).json({
      success: false,
      message: 'sourceRoleId dan targetRoleId diperlukan'
    });
  }
  
  // Cek apakah kedua role valid
  const sourceRole = await roleService.getRoleById(sourceRoleId);
  const targetRole = await roleService.getRoleById(targetRoleId);
  
  // Salin permission
  const copiedCount = await aclService.copyPermissions(sourceRoleId, targetRoleId);

  // Catat aktivitas
  auditService.logActivity({
    userId: req.user.id,
    action: 'UPDATE',
    module: 'ROLE',
    description: `Menyalin permission dari role: ${sourceRole.name} ke role: ${targetRole.name}`,
    resourceId: targetRoleId,
    newValues: { sourceRoleId, targetRoleId }
  }).catch(err => console.error('Error logging copy permissions activity:', err));

  return res.json({
    success: true,
    message: `Berhasil menyalin ${copiedCount} permission ke role target`,
    data: { copiedCount }
  });
});

module.exports = {
  getRoleHierarchy,
  getAllRolePermissions,
  updateParentRole,
  grantFullAccess,
  copyPermissions
};
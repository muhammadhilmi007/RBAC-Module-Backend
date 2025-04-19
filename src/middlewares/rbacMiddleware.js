// src/middlewares/rbacMiddleware.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware untuk memeriksa apakah user memiliki akses ke fitur dan permission tertentu
 * @param {String} featureName - Nama fitur yang ingin diakses
 * @param {String} permissionName - Jenis permission (View, Create, Edit, Delete)
 */
const checkAccess = (featureName, permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User tidak terautentikasi.' 
        });
      }

      // Cari feature dan permission berdasarkan nama
      const feature = await prisma.feature.findFirst({
        where: { name: featureName }
      });

      const permission = await prisma.permission.findFirst({
        where: { name: permissionName }
      });

      if (!feature || !permission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feature atau permission tidak ditemukan.' 
        });
      }

      // Dapatkan chain role (role saat ini dan semua parent roles)
      const roleChain = await getRoleChain(req.user.role.id);
      const roleIds = roleChain.map(role => role.id);
      
      // Cek apakah user memiliki akses berdasarkan rolenya atau parent roles
      const access = await prisma.aCL.findFirst({
        where: {
          roleId: { in: roleIds },
          featureId: feature.id,
          permissionId: permission.id
        }
      });

      if (!access) {
        return res.status(403).json({ 
          success: false, 
          message: 'Akses ditolak. Anda tidak memiliki hak akses untuk operasi ini.' 
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat memeriksa hak akses.' 
      });
    }
  };
};

/**
 * Mendapatkan rantai role (role saat ini dan semua parent roles)
 * @param {Number} roleId - ID role
 * @returns {Promise<Array>} - Array of role objects
 */
async function getRoleChain(roleId) {
  const result = [];
  let currentRoleId = roleId;
  const visitedRoles = new Set(); // Untuk mencegah infinite loop jika ada circular reference
  
  while (currentRoleId && !visitedRoles.has(currentRoleId)) {
    visitedRoles.add(currentRoleId);
    
    const role = await prisma.role.findUnique({
      where: { id: currentRoleId },
      select: { id: true, name: true, parentRoleId: true }
    });
    
    if (!role) break;
    
    result.push(role);
    currentRoleId = role.parentRoleId;
  }
  
  return result;
}

module.exports = {
  checkAccess
};
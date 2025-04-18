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

      // Cek apakah user memiliki akses berdasarkan rolenya
      const access = await prisma.aCL.findFirst({
        where: {
          roleId: req.user.role.id,
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

module.exports = {
  checkAccess
};
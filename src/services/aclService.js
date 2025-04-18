// src/services/aclService.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Service untuk mendapatkan data ACL (Access Control List)
 */
class ACLService {
  /**
   * Mendapatkan daftar fitur dan permission berdasarkan roleId
   * @param {Number} roleId - ID role
   * @returns {Object} - Data fitur dan permission
   */
  async getUserAccess(roleId) {
    // Ambil semua data ACL berdasarkan roleId
    const accessList = await prisma.aCL.findMany({
      where: { roleId },
      include: {
        feature: true,
        permission: true
      }
    });

    // Struktur ulang data untuk mempermudah penggunaan di frontend
    const featuresMap = new Map();

    accessList.forEach(access => {
      const featureId = access.feature.id;
      
      if (!featuresMap.has(featureId)) {
        featuresMap.set(featureId, {
          id: access.feature.id,
          name: access.feature.name,
          route: access.feature.route,
          icon: access.feature.icon,
          permissions: []
        });
      }

      // Tambahkan permission ke fitur
      featuresMap.get(featureId).permissions.push({
        id: access.permission.id,
        name: access.permission.name
      });
    });

    // Konversi Map ke array
    const features = Array.from(featuresMap.values());

    return { features };
  }

  /**
   * Cek apakah user memiliki akses ke fitur dan permission tertentu
   * @param {Number} roleId - ID role
   * @param {String} featureName - Nama fitur
   * @param {String} permissionName - Nama permission
   * @returns {Boolean} - True jika memiliki akses, false jika tidak
   */
  async checkUserAccess(roleId, featureName, permissionName) {
    // Cari feature dan permission berdasarkan nama
    const feature = await prisma.feature.findFirst({
      where: { name: featureName }
    });

    const permission = await prisma.permission.findFirst({
      where: { name: permissionName }
    });

    if (!feature || !permission) {
      return false;
    }

    // Cek apakah user memiliki akses
    const access = await prisma.aCL.findFirst({
      where: {
        roleId,
        featureId: feature.id,
        permissionId: permission.id
      }
    });

    return !!access;
  }

  /**
   * Mendapatkan daftar semua fitur
   * @returns {Array} - Daftar fitur
   */
  async getAllFeatures() {
    return await prisma.feature.findMany();
  }

  /**
   * Mendapatkan daftar semua permission
   * @returns {Array} - Daftar permission
   */
  async getAllPermissions() {
    return await prisma.permission.findMany();
  }
}

module.exports = new ACLService();
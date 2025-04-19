// src/services/aclService.js
const { PrismaClient } = require('@prisma/client');
const roleService = require('./roleService');

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
    // Dapatkan semua permission dari role ini dan parent roles
    const allPermissions = await roleService.getAllRolePermissions(roleId);
    
    // Struktur ulang data untuk mempermudah penggunaan di frontend
    const featuresMap = new Map();

    allPermissions.forEach(access => {
      const featureId = access.feature.id;
      
      if (!featuresMap.has(featureId)) {
        featuresMap.set(featureId, {
          id: access.feature.id,
          name: access.feature.name,
          route: access.feature.route,
          icon: access.feature.icon,
          permissions: [],
          // Tandai jika permission ini berasal dari parent role
          inheritedFrom: access.roleId !== Number(roleId) ? access.roleId : null
        });
      }

      // Tambahkan permission ke fitur jika belum ada
      const feature = featuresMap.get(featureId);
      const permissionExists = feature.permissions.some(p => p.id === access.permission.id);
      
      if (!permissionExists) {
        feature.permissions.push({
          id: access.permission.id,
          name: access.permission.name,
          // Tandai jika permission ini diwarisi
          inheritedFrom: access.roleId !== Number(roleId) ? access.roleId : null
        });
      }
    });

    // Konversi Map ke array
    const features = Array.from(featuresMap.values());

    // Jika perlu, ambil informasi tentang role yang mewarisi permissions
    const inheritingRoleIds = new Set();
    features.forEach(feature => {
      if (feature.inheritedFrom) inheritingRoleIds.add(feature.inheritedFrom);
      feature.permissions.forEach(perm => {
        if (perm.inheritedFrom) inheritingRoleIds.add(perm.inheritedFrom);
      });
    });

    // Jika ada permissions yang diwarisi, ambil data role untuk referensi
    let inheritingRoles = {};
    if (inheritingRoleIds.size > 0) {
      const roles = await prisma.role.findMany({
        where: {
          id: { in: Array.from(inheritingRoleIds) }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Convert to object for easy lookup
      inheritingRoles = roles.reduce((acc, role) => {
        acc[role.id] = role;
        return acc;
      }, {});
    }

    return { features, inheritingRoles };
  }

  /**
   * Cek apakah user memiliki akses ke fitur dan permission tertentu
   * (memperhitungkan inheritance)
   * @param {Number} roleId - ID role
   * @param {String} featureName - Nama fitur
   * @param {String} permissionName - Nama permission
   * @returns {Boolean} - True jika memiliki akses, false jika tidak
   */
  async checkUserAccess(roleId, featureName, permissionName) {
    try {
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

      // Dapatkan roles dalam hierarki
      const getParentRoles = async (id, roles = []) => {
        const role = await prisma.role.findUnique({
          where: { id: Number(id) },
          include: { parentRole: true }
        });

        if (!role) return roles;
        
        roles.push(role.id);
        
        if (role.parentRoleId) {
          await getParentRoles(role.parentRoleId, roles);
        }
        
        return roles;
      };

      // Ambil role dan semua parent roles
      const roleIds = await getParentRoles(roleId);

      // Cek apakah kombinasi feature-permission ada di salah satu role dalam hierarki
      const access = await prisma.aCL.findFirst({
        where: {
          roleId: { in: roleIds },
          featureId: feature.id,
          permissionId: permission.id
        }
      });

      return !!access;
    } catch (error) {
      console.error('Error in checkUserAccess:', error);
      return false;
    }
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

  /**
   * Memberikan akses penuh pada semua fitur untuk role tertentu
   * @param {Number} roleId - ID role
   * @returns {Number} - Jumlah akses yang ditambahkan
   */
  async grantFullAccess(roleId) {
    // Ambil semua fitur dan permission
    const [features, permissions] = await Promise.all([
      this.getAllFeatures(),
      this.getAllPermissions()
    ]);

    // Bangun array objek untuk operasi createMany
    const aclEntries = [];
    
    for (const feature of features) {
      for (const permission of permissions) {
        // Cek apakah kombinasi ini sudah ada
        const exists = await prisma.aCL.findFirst({
          where: {
            roleId: Number(roleId),
            featureId: feature.id,
            permissionId: permission.id
          }
        });
        
        if (!exists) {
          aclEntries.push({
            roleId: Number(roleId),
            featureId: feature.id,
            permissionId: permission.id
          });
        }
      }
    }

    // Tambahkan semua entries ke database
    if (aclEntries.length > 0) {
      await prisma.aCL.createMany({
        data: aclEntries,
        skipDuplicates: true
      });
    }

    return aclEntries.length;
  }

  /**
   * Menyalin permission dari satu role ke role lainnya
   * @param {Number} sourceRoleId - ID role sumber
   * @param {Number} targetRoleId - ID role target
   * @returns {Number} - Jumlah permission yang disalin
   */
  async copyPermissions(sourceRoleId, targetRoleId) {
    // Ambil semua permission dari role sumber
    const sourcePermissions = await prisma.aCL.findMany({
      where: { roleId: Number(sourceRoleId) }
    });

    // Siapkan data untuk insert
    const permissionsToAdd = [];
    
    for (const perm of sourcePermissions) {
      // Cek apakah permission sudah ada di role target
      const exists = await prisma.aCL.findFirst({
        where: {
          roleId: Number(targetRoleId),
          featureId: perm.featureId,
          permissionId: perm.permissionId
        }
      });
      
      if (!exists) {
        permissionsToAdd.push({
          roleId: Number(targetRoleId),
          featureId: perm.featureId,
          permissionId: perm.permissionId
        });
      }
    }

    // Tambahkan semua permission ke role target
    if (permissionsToAdd.length > 0) {
      await prisma.aCL.createMany({
        data: permissionsToAdd,
        skipDuplicates: true
      });
    }

    return permissionsToAdd.length;
  }
}

module.exports = new ACLService();
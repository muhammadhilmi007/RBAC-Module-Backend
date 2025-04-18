// src/services/roleService.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Service untuk mengelola Role
 */
class RoleService {
  /**
   * Mendapatkan semua role
   * @returns {Array} - Daftar role
   */
  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });
  }

  /**
   * Mendapatkan role berdasarkan ID
   * @param {Number} id - ID role
   * @returns {Object} - Data role
   */
  async getRoleById(id) {
    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        acl: {
          include: {
            feature: true,
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role tidak ditemukan');
    }

    return role;
  }

  /**
   * Membuat role baru
   * @param {String} name - Nama role
   * @returns {Object} - Data role yang dibuat
   */
  async createRole(name) {
    // Cek apakah role dengan nama tersebut sudah ada
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      throw new Error('Role dengan nama tersebut sudah ada');
    }

    return await prisma.role.create({
      data: { name }
    });
  }

  /**
   * Mengupdate role
   * @param {Number} id - ID role
   * @param {String} name - Nama role baru
   * @returns {Object} - Data role yang diupdate
   */
  async updateRole(id, name) {
    // Cek apakah role dengan nama tersebut sudah ada (selain role ini sendiri)
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        id: { not: Number(id) }
      }
    });

    if (existingRole) {
      throw new Error('Role dengan nama tersebut sudah ada');
    }

    return await prisma.role.update({
      where: { id: Number(id) },
      data: { name }
    });
  }

  /**
   * Menghapus role
   * @param {Number} id - ID role
   * @returns {Object} - Data role yang dihapus
   */
  async deleteRole(id) {
    // Cek apakah role memiliki user
    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role tidak ditemukan');
    }

    if (role._count.users > 0) {
      throw new Error('Role masih digunakan oleh pengguna');
    }

    // Hapus semua ACL yang terkait dengan role
    await prisma.aCL.deleteMany({
      where: { roleId: Number(id) }
    });

    // Hapus role
    return await prisma.role.delete({
      where: { id: Number(id) }
    });
  }

  /**
   * Menambahkan hak akses ke role
   * @param {Number} roleId - ID role
   * @param {Number} featureId - ID fitur
   * @param {Number} permissionId - ID permission
   * @returns {Object} - Data ACL yang dibuat
   */
  async addRolePermission(roleId, featureId, permissionId) {
    // Cek apakah kombinasi role-feature-permission sudah ada
    const existingPermission = await prisma.aCL.findFirst({
      where: {
        roleId: Number(roleId),
        featureId: Number(featureId),
        permissionId: Number(permissionId)
      }
    });

    if (existingPermission) {
      throw new Error('Permission tersebut sudah ada pada role ini');
    }

    return await prisma.aCL.create({
      data: {
        roleId: Number(roleId),
        featureId: Number(featureId),
        permissionId: Number(permissionId)
      },
      include: {
        feature: true,
        permission: true
      }
    });
  }

  /**
   * Menghapus hak akses dari role
   * @param {Number} roleId - ID role
   * @param {Number} featureId - ID fitur
   * @param {Number} permissionId - ID permission
   * @returns {Object} - Data ACL yang dihapus
   */
  async removeRolePermission(roleId, featureId, permissionId) {
    return await prisma.aCL.deleteMany({
      where: {
        roleId: Number(roleId),
        featureId: Number(featureId),
        permissionId: Number(permissionId)
      }
    });
  }
}

module.exports = new RoleService();
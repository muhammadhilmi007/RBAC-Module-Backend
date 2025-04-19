// src/services/roleService.js
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/errorHandler');

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
        parentRole: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            childRoles: true
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
        parentRole: {
          select: {
            id: true,
            name: true
          }
        },
        childRoles: {
          select: {
            id: true,
            name: true
          }
        },
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
      throw new AppError('Role tidak ditemukan', 404);
    }

    return role;
  }

  /**
   * Membuat role baru
   * @param {Object} roleData - Data role
   * @param {String} roleData.name - Nama role
   * @param {String} roleData.description - Deskripsi role (opsional)
   * @param {Number} roleData.parentRoleId - ID parent role untuk inheritance (opsional)
   * @returns {Object} - Data role yang dibuat
   */
  async createRole(roleData) {
    // Cek apakah role dengan nama tersebut sudah ada
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name }
    });

    if (existingRole) {
      throw new AppError('Role dengan nama tersebut sudah ada', 400);
    }

    // Cek apakah parent role valid jika disediakan
    if (roleData.parentRoleId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: Number(roleData.parentRoleId) }
      });

      if (!parentRole) {
        throw new AppError('Parent role tidak ditemukan', 400);
      }

      // Cek circular reference
      if (await this.wouldCreateCircularReference(null, Number(roleData.parentRoleId))) {
        throw new AppError('Tidak dapat membuat role dengan referensi melingkar', 400);
      }
    }

    // Buat role baru
    return await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description || null,
        parentRoleId: roleData.parentRoleId ? Number(roleData.parentRoleId) : null
      }
    });
  }

  /**
   * Mengupdate role
   * @param {Number} id - ID role
   * @param {Object} roleData - Data role yang akan diupdate
   * @param {String} roleData.name - Nama role baru (opsional)
   * @param {String} roleData.description - Deskripsi role baru (opsional)
   * @param {Number} roleData.parentRoleId - ID parent role baru (opsional)
   * @returns {Object} - Data role yang diupdate
   */
  async updateRole(id, roleData) {
    const roleId = Number(id);
    
    // Cek apakah role ada
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new AppError('Role tidak ditemukan', 404);
    }

    // Cek apakah nama role sudah digunakan role lain
    if (roleData.name && roleData.name !== role.name) {
      const existingRole = await prisma.role.findFirst({
        where: {
          name: roleData.name,
          id: { not: roleId }
        }
      });

      if (existingRole) {
        throw new AppError('Role dengan nama tersebut sudah ada', 400);
      }
    }

    // Cek apakah parent role valid jika disediakan
    if (roleData.parentRoleId !== undefined) {
      if (roleData.parentRoleId === null) {
        // Jika parentRoleId diset null, berarti menghapus parent
      } else {
        // Jika parentRoleId diubah, cek validitas
        const parentRole = await prisma.role.findUnique({
          where: { id: Number(roleData.parentRoleId) }
        });

        if (!parentRole) {
          throw new AppError('Parent role tidak ditemukan', 400);
        }

        // Cek apakah parentRoleId sama dengan roleId sendiri
        if (Number(roleData.parentRoleId) === roleId) {
          throw new AppError('Role tidak bisa menjadi parent dari dirinya sendiri', 400);
        }

        // Cek circular reference
        if (await this.wouldCreateCircularReference(roleId, Number(roleData.parentRoleId))) {
          throw new AppError('Tidak dapat membuat referensi melingkar dalam hierarki role', 400);
        }
      }
    }

    // Siapkan data update
    const updateData = {};
    if (roleData.name !== undefined) updateData.name = roleData.name;
    if (roleData.description !== undefined) updateData.description = roleData.description;
    if (roleData.parentRoleId !== undefined) {
      updateData.parentRoleId = roleData.parentRoleId !== null 
        ? Number(roleData.parentRoleId) 
        : null;
    }

    // Update role
    return await prisma.role.update({
      where: { id: roleId },
      data: updateData
    });
  }

  /**
   * Menghapus role
   * @param {Number} id - ID role
   * @returns {Object} - Data role yang dihapus
   */
  async deleteRole(id) {
    const roleId = Number(id);
    
    // Cek apakah role ada
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
            childRoles: true
          }
        }
      }
    });

    if (!role) {
      throw new AppError('Role tidak ditemukan', 404);
    }

    // Cek apakah role masih digunakan oleh user
    if (role._count.users > 0) {
      throw new AppError('Role masih digunakan oleh pengguna', 400);
    }

    // Cek apakah role masih memiliki child roles
    if (role._count.childRoles > 0) {
      throw new AppError('Role masih memiliki child roles, hapus atau pindahkan child roles terlebih dahulu', 400);
    }

    // Hapus semua ACL untuk role ini
    await prisma.aCL.deleteMany({
      where: { roleId }
    });

    // Hapus role
    return await prisma.role.delete({
      where: { id: roleId }
    });
  }

  /**
   * Mendapatkan daftar all role dan relasinya untuk tampilan hierarki
   * @returns {Array} - Daftar role dalam format hierarki
   */
  async getRoleHierarchy() {
    // Ambil semua role dengan parent dan child
    const allRoles = await prisma.role.findMany({
      include: {
        parentRole: {
          select: {
            id: true,
            name: true
          }
        },
        childRoles: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Ambil root roles (roles tanpa parent)
    const rootRoles = allRoles.filter(role => !role.parentRoleId);

    // Build hierarchy recursively
    const buildHierarchy = (roles) => {
      return roles.map(role => {
        const children = allRoles.filter(r => r.parentRoleId === role.id);
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          children: children.length > 0 ? buildHierarchy(children) : []
        };
      });
    };

    return buildHierarchy(rootRoles);
  }

  /**
   * Cek apakah mengubah parentRole akan menyebabkan circular reference
   * @param {Number} roleId - ID role yang sedang diupdate (null jika role baru)
   * @param {Number} newParentId - ID parent role baru
   * @returns {Boolean} - true jika akan menyebabkan circular reference
   */
  async wouldCreateCircularReference(roleId, newParentId) {
    // Jika role baru, tidak mungkin membuat circular reference
    if (roleId === null) return false;

    // Jika parent baru adalah role itu sendiri, ini circular reference
    if (roleId === newParentId) return true;

    // Ambil semua child roles dari role yang sedang diupdate
    let childRoles = await prisma.role.findMany({
      where: { parentRoleId: roleId },
      select: { id: true }
    });

    // Recursive check untuk semua child
    for (const child of childRoles) {
      // Jika parent baru adalah salah satu child, ini circular reference
      if (child.id === newParentId) return true;
      
      // Cek semua descendants
      if (await this.wouldCreateCircularReference(child.id, newParentId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Menambahkan permission ke role
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
      throw new AppError('Permission tersebut sudah ada pada role ini', 400);
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
   * Menghapus permission dari role
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

  /**
   * Mendapatkan semua permission yang dimiliki role (termasuk dari parent roles)
   * @param {Number} roleId - ID role
   * @returns {Array} - Daftar permission
   */
  async getAllRolePermissions(roleId) {
    // Mengambil role beserta parent role secara rekursif
    const getParentRoles = async (id, roles = []) => {
      const role = await prisma.role.findUnique({
        where: { id: Number(id) },
        include: { parentRole: true }
      });

      if (!role) return roles;
      
      roles.push(role);
      
      if (role.parentRoleId) {
        await getParentRoles(role.parentRoleId, roles);
      }
      
      return roles;
    };

    // Ambil role dan semua parent roles
    const roleHierarchy = await getParentRoles(roleId);
    const roleIds = roleHierarchy.map(r => r.id);

    // Ambil semua permission untuk semua role dalam hierarki
    const allPermissions = await prisma.aCL.findMany({
      where: {
        roleId: { in: roleIds }
      },
      include: {
        feature: true,
        permission: true
      }
    });

    // Deduplicate berdasarkan kombinasi feature-permission
    const uniquePermissions = [];
    const seen = new Set();

    for (const perm of allPermissions) {
      const key = `${perm.featureId}-${perm.permissionId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePermissions.push(perm);
      }
    }

    return uniquePermissions;
  }
}

module.exports = new RoleService();
// src/services/userService.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Service untuk mengelola User
 */
class UserService {
  /**
   * Mendapatkan semua user
   * @returns {Array} - Daftar user
   */
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Mendapatkan user berdasarkan ID
   * @param {Number} id - ID user
   * @returns {Object} - Data user
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    return user;
  }

  /**
   * Membuat user baru
   * @param {Object} userData - Data user
   * @returns {Object} - Data user yang dibuat
   */
  async createUser(userData) {
    const { name, email, password, roleId } = userData;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: Number(roleId)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return newUser;
  }

  /**
   * Mengupdate user
   * @param {Number} id - ID user
   * @param {Object} userData - Data user yang akan diupdate
   * @returns {Object} - Data user yang diupdate
   */
  async updateUser(id, userData) {
    const { name, email, roleId, password } = userData;

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Cek apakah email sudah digunakan oleh user lain
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email sudah digunakan');
      }
    }

    // Siapkan data yang akan diupdate
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (roleId) updateData.roleId = Number(roleId);
    
    // Jika ada password baru, hash password
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Menghapus user
   * @param {Number} id - ID user
   * @returns {Object} - Data user yang dihapus
   */
  async deleteUser(id) {
    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Hapus user
    await prisma.user.delete({
      where: { id: Number(id) }
    });

    return { id: Number(id) };
  }

  /**
   * Mengubah password user
   * @param {Number} id - ID user
   * @param {String} oldPassword - Password lama
   * @param {String} newPassword - Password baru
   * @returns {Object} - Data user yang diupdate
   */
  async changePassword(id, oldPassword, newPassword) {
    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Password lama salah');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        updatedAt: true
      }
    });

    return updatedUser;
  }
}

module.exports = new UserService();
// src/services/authService.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

/**
 * Service untuk autentikasi user
 */
class AuthService {
  /**
   * Login user dengan email dan password
   * @param {String} email - Email user
   * @param {String} password - Password user
   * @returns {Object} - Data user dan token jika berhasil
   */
  async login(email, password) {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      throw new Error('Email atau password salah');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    });

    // Return user data dan token
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
          id: user.role.id,
          name: user.role.name
        }
      },
      token
    };
  }

  /**
   * Mendapatkan data user dari userId
   * @param {Number} userId - ID user
   * @returns {Object} - Data user
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    return user;
  }
}

module.exports = new AuthService();
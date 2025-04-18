// src/services/authService.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken,
  getRefreshTokenExpiry
} = require('../utils/jwt');
const { AppError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Service untuk autentikasi user
 */
class AuthService {
  /**
   * Login user dengan email dan password
   * @param {String} email - Email user
   * @param {String} password - Password user
   * @returns {Object} - Data user, access token dan refresh token jika berhasil
   */
  async login(email, password) {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      throw new AppError('Email atau password salah', 401);
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email atau password salah', 401);
    }

    // Generate token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    // Simpan refresh token ke database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
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
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token dengan refresh token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} - Access token baru dan refresh token baru
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token diperlukan', 400);
    }

    // Cari refresh token di database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } }
    });

    // Verifikasi refresh token
    if (!storedToken) {
      throw new AppError('Refresh token tidak valid', 401);
    }

    // Cek apakah token sudah kadaluarsa atau dicabut
    if (storedToken.expiresAt < new Date() || storedToken.isRevoked) {
      throw new AppError('Refresh token sudah kadaluarsa atau dicabut', 401);
    }

    // Generate access token baru
    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      roleId: storedToken.user.roleId
    });

    // Generate refresh token baru (token rotation untuk keamanan tambahan)
    const newRefreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    // Revoke refresh token lama dan buat yang baru
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true }
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.userId,
          expiresAt
        }
      })
    ]);

    // Return token baru
    return {
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: {
          id: storedToken.user.role.id,
          name: storedToken.user.role.name
        }
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout user (revoke refresh token)
   * @param {String} refreshToken - Refresh token
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }

    // Temukan dan revoke refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });
  }

  /**
   * Mencabut semua refresh token untuk user tertentu
   * @param {Number} userId - ID user
   */
  async revokeAllUserTokens(userId) {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });
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
      throw new AppError('User tidak ditemukan', 404);
    }

    return user;
  }
}

module.exports = new AuthService();
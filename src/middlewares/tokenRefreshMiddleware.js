// src/middlewares/tokenRefreshMiddleware.js
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Middleware untuk memverifikasi refresh token
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    // Dapatkan refresh token dari cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return next(new AppError('Refresh token tidak tersedia', 401));
    }

    // Cek apakah refresh token ada di database dan valid
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      return next(new AppError('Refresh token tidak valid', 401));
    }

    // Cek apakah token sudah kadaluarsa atau dicabut
    if (storedToken.expiresAt < new Date() || storedToken.isRevoked) {
      return next(new AppError('Refresh token sudah kadaluarsa atau dicabut', 401));
    }

    // Simpan user dan refresh token ke request
    req.user = storedToken.user;
    req.refreshToken = storedToken;

    next();
  } catch (error) {
    next(new AppError('Terjadi kesalahan saat memvalidasi refresh token', 500));
  }
};

/**
 * Middleware untuk mencatat waktu akses terakhir dari refresh token
 */
const trackRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Update waktu akses terakhir token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, isRevoked: false },
        data: { updatedAt: new Date() }
      });
    }
    
    next();
  } catch (error) {
    // Tidak menampilkan error ke client, hanya log
    console.error('Error tracking refresh token:', error);
    next();
  }
};

/**
 * Middleware untuk membersihkan refresh token yang kadaluarsa
 * Dijalankan secara periodik, bukan pada setiap request
 */
const cleanupExpiredTokens = async () => {
  try {
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    });
    
    console.log(`Cleaned up ${deletedTokens.count} expired or revoked refresh tokens`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

module.exports = {
  validateRefreshToken,
  trackRefreshToken,
  cleanupExpiredTokens
};
// src/middlewares/authMiddleware.js
const { verifyAccessToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Middleware untuk memverifikasi token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Dapatkan token dari header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Akses ditolak. Token tidak tersedia.', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next(new AppError('Token tidak valid atau kadaluarsa.', 401));
    }

    // Ambil informasi user dari database dengan role dan parent role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        role: {
          include: {
            parentRole: true
          }
        } 
      }
    });

    if (!user) {
      return next(new AppError('Pengguna tidak ditemukan.', 401));
    }

    // Simpan informasi user ke request untuk digunakan di middleware/controller berikutnya
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: {
        id: user.role.id,
        name: user.role.name,
        parentRoleId: user.role.parentRoleId || null,
        parentRole: user.role.parentRole ? {
          id: user.role.parentRole.id,
          name: user.role.parentRole.name
        } : null
      }
    };

    next();
  } catch (error) {
    next(new AppError('Terjadi kesalahan saat autentikasi.', 500));
  }
};

module.exports = {
  authenticate
};
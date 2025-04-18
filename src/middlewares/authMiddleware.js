// src/middlewares/authMiddleware.js
const { verifyToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware untuk memverifikasi token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Dapatkan token dari header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Akses ditolak. Token tidak tersedia.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token tidak valid atau kadaluarsa.' 
      });
    }

    // Ambil informasi user dari database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Pengguna tidak ditemukan.' 
      });
    }

    // Simpan informasi user ke request untuk digunakan di middleware/controller berikutnya
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: {
        id: user.role.id,
        name: user.role.name
      }
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat autentikasi.' 
    });
  }
};

module.exports = {
  authenticate
};
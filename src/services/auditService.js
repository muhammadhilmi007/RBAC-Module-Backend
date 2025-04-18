// src/services/auditService.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Service untuk mengelola Audit Trail
 */
class AuditService {
  /**
   * Mencatat aktivitas pengguna
   * 
   * @param {Object} auditData - Data untuk audit log
   * @param {Number} auditData.userId - ID user yang melakukan aktivitas
   * @param {String} auditData.action - Tipe aktivitas (CREATE, READ, UPDATE, DELETE, etc.)
   * @param {String} auditData.module - Modul/fitur yang diakses
   * @param {String} auditData.description - Deskripsi aktivitas
   * @param {String} [auditData.ipAddress] - Alamat IP pengguna (opsional)
   * @param {String} [auditData.userAgent] - User agent/browser (opsional)
   * @param {String} [auditData.resourceId] - ID resource yang terkena dampak (opsional)
   * @param {Object} [auditData.oldValues] - Nilai sebelum perubahan (opsional)
   * @param {Object} [auditData.newValues] - Nilai setelah perubahan (opsional)
   * @returns {Promise<Object>} - Data audit log yang telah dibuat
   */
  async logActivity(auditData) {
    try {
      // Validasi data wajib
      const requiredFields = ['userId', 'action', 'module', 'description'];
      for (const field of requiredFields) {
        if (!auditData[field]) {
          throw new Error(`Field '${field}' wajib diisi untuk audit log`);
        }
      }

      // Buat audit log
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: auditData.action,
          module: auditData.module,
          description: auditData.description,
          ipAddress: auditData.ipAddress || null,
          userAgent: auditData.userAgent || null,
          resourceId: auditData.resourceId ? String(auditData.resourceId) : null,
          oldValues: auditData.oldValues || null,
          newValues: auditData.newValues || null
        }
      });

      return auditLog;
    } catch (error) {
      // Log error tapi jangan mengganggu flow aplikasi
      console.error('Error saat mencatat audit log:', error);
      return null;
    }
  }

  /**
   * Mendapatkan daftar aktivitas user berdasarkan filter
   * 
   * @param {Object} filter - Filter untuk mengambil log
   * @param {Number} [filter.userId] - Filter berdasarkan user ID
   * @param {String} [filter.action] - Filter berdasarkan action
   * @param {String} [filter.module] - Filter berdasarkan module
   * @param {Date} [filter.startDate] - Filter aktivitas setelah tanggal ini
   * @param {Date} [filter.endDate] - Filter aktivitas sebelum tanggal ini
   * @param {Number} [page=1] - Halaman yang diminta
   * @param {Number} [limit=10] - Jumlah item per halaman
   * @returns {Promise<Object>} - Daftar audit log dan informasi pagination
   */
  async getAuditLogs(filter = {}, page = 1, limit = 10) {
    try {
      // Bangun where clause berdasarkan filter
      const where = {};
      
      if (filter.userId) {
        where.userId = filter.userId;
      }
      
      if (filter.action) {
        where.action = filter.action;
      }
      
      if (filter.module) {
        where.module = filter.module;
      }
      
      // Filter berdasarkan tanggal
      if (filter.startDate || filter.endDate) {
        where.createdAt = {};
        
        if (filter.startDate) {
          where.createdAt.gte = new Date(filter.startDate);
        }
        
        if (filter.endDate) {
          where.createdAt.lte = new Date(filter.endDate);
        }
      }

      // Hitung total items untuk pagination
      const totalItems = await prisma.auditLog.count({ where });
      
      // Ambil data dengan pagination
      const skip = (page - 1) * limit;
      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
      
      // Informasi pagination
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        data: auditLogs,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error saat mengambil audit logs:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan daftar action yang tersedia untuk filter
   * @returns {Promise<Array<String>>} - Daftar action unik
   */
  async getDistinctActions() {
    try {
      const actions = await prisma.$queryRaw`SELECT DISTINCT action FROM "AuditLog" ORDER BY action`;
      return actions.map(item => item.action);
    } catch (error) {
      console.error('Error saat mengambil distinct actions:', error);
      return [];
    }
  }

  /**
   * Mendapatkan daftar module yang tersedia untuk filter
   * @returns {Promise<Array<String>>} - Daftar module unik
   */
  async getDistinctModules() {
    try {
      const modules = await prisma.$queryRaw`SELECT DISTINCT module FROM "AuditLog" ORDER BY module`;
      return modules.map(item => item.module);
    } catch (error) {
      console.error('Error saat mengambil distinct modules:', error);
      return [];
    }
  }
}

module.exports = new AuditService();
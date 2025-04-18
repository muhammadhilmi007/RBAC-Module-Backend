// src/middlewares/auditMiddleware.js
const auditService = require('../services/auditService');

/**
 * Middleware untuk mencatat aktivitas API
 * 
 * @param {String} module - Nama modul/fitur
 * @param {String} action - Tipe aktivitas (CREATE, READ, UPDATE, DELETE, etc.)
 * @param {Function} [getDescription] - Fungsi untuk mendapatkan deskripsi (menerima req dan res)
 * @param {Function} [getResourceId] - Fungsi untuk mendapatkan resource ID (menerima req dan res)
 * @param {Function} [getOldValues] - Fungsi untuk mendapatkan nilai lama (menerima req dan res) untuk UPDATE
 * @param {Function} [getNewValues] - Fungsi untuk mendapatkan nilai baru (menerima req dan res) untuk CREATE/UPDATE
 */
const auditActivity = (module, action, getDescription, getResourceId, getOldValues, getNewValues) => {
  return async (req, res, next) => {
    // Simpan referensi ke original end method
    const originalEnd = res.end;
    
    // Override end method
    res.end = async function(...args) {
      // Hanya catat jika request berhasil (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          // Siapkan data audit
          const auditData = {
            userId: req.user.id,
            action,
            module,
            description: typeof getDescription === 'function' ? getDescription(req, res) : `${action} pada modul ${module}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            resourceId: typeof getResourceId === 'function' ? getResourceId(req, res) : null,
            oldValues: typeof getOldValues === 'function' ? getOldValues(req, res) : null,
            newValues: typeof getNewValues === 'function' ? getNewValues(req, res) : null
          };
          
          // Catat aktivitas (tapi jangan tunggu)
          auditService.logActivity(auditData).catch(err => {
            console.error('Error saat mencatat audit log:', err);
          });
        } catch (error) {
          console.error('Error di audit middleware:', error);
          // Jangan mengganggu response, jadi hanya log error
        }
      }
      
      // Panggil original end method
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

/**
 * Middleware untuk mencatat login
 */
const auditLogin = async (req, res, next) => {
  // Login dicatat di controller, bukan di middleware, karena memerlukan hasil autentikasi
  next();
};

/**
 * Middleware untuk mencatat logout
 */
const auditLogout = async (req, res, next) => {
  // Logout dicatat di controller, karena memerlukan hasil logout
  next();
};

module.exports = {
  auditActivity,
  auditLogin,
  auditLogout
};
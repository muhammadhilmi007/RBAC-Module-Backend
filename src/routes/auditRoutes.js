// src/routes/auditRoutes.js
const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkAccess } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan audit logs - memerlukan akses View pada Pengaturan
router.get(
  '/',
  checkAccess('Pengaturan', 'View'),
  auditController.getAuditLogs
);

// Route untuk mendapatkan filter options - memerlukan akses View pada Pengaturan
router.get(
  '/filter-options',
  checkAccess('Pengaturan', 'View'),
  auditController.getFilterOptions
);

module.exports = router;
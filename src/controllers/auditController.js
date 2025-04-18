// src/controllers/auditController.js
const auditService = require('../services/auditService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Controller untuk mendapatkan audit logs
 */
const getAuditLogs = catchAsync(async (req, res) => {
  // Ambil parameter pagination dan filter dari query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Bangun filter dari query parameters
  const filter = {};
  
  if (req.query.userId) {
    filter.userId = parseInt(req.query.userId);
  }
  
  if (req.query.action) {
    filter.action = req.query.action;
  }
  
  if (req.query.module) {
    filter.module = req.query.module;
  }
  
  if (req.query.startDate) {
    filter.startDate = req.query.startDate;
  }
  
  if (req.query.endDate) {
    filter.endDate = req.query.endDate;
  }
  
  // Ambil data audit logs
  const result = await auditService.getAuditLogs(filter, page, limit);
  
  return res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
});

/**
 * Controller untuk mendapatkan filter options
 */
const getFilterOptions = catchAsync(async (req, res) => {
  // Ambil daftar actions dan modules untuk dropdown filter
  const [actions, modules] = await Promise.all([
    auditService.getDistinctActions(),
    auditService.getDistinctModules()
  ]);
  
  return res.json({
    success: true,
    data: {
      actions,
      modules
    }
  });
});

module.exports = {
  getAuditLogs,
  getFilterOptions
};
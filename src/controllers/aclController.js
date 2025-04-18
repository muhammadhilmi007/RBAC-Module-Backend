// src/controllers/aclController.js
const aclService = require('../services/aclService');

/**
 * Controller untuk mendapatkan akses user berdasarkan roleId
 */
const getUserAccess = async (req, res) => {
  try {
    const roleId = req.user.role.id;
    const access = await aclService.getUserAccess(roleId);

    return res.json({
      success: true,
      data: access
    });
  } catch (error) {
    console.error('Get user access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mendapatkan akses user'
    });
  }
};

/**
 * Controller untuk memeriksa apakah user memiliki akses ke fitur dan permission tertentu
 */
const checkAccess = async (req, res) => {
  try {
    const { featureName, permissionName } = req.body;
    const roleId = req.user.role.id;

    if (!featureName || !permissionName) {
      return res.status(400).json({
        success: false,
        message: 'Nama fitur dan permission diperlukan'
      });
    }

    const hasAccess = await aclService.checkUserAccess(roleId, featureName, permissionName);

    return res.json({
      success: true,
      data: { hasAccess }
    });
  } catch (error) {
    console.error('Check access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memeriksa akses'
    });
  }
};

/**
 * Controller untuk mendapatkan semua fitur
 */
const getAllFeatures = async (req, res) => {
  try {
    const features = await aclService.getAllFeatures();

    return res.json({
      success: true,
      data: { features }
    });
  } catch (error) {
    console.error('Get all features error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mendapatkan daftar fitur'
    });
  }
};

/**
 * Controller untuk mendapatkan semua permission
 */
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await aclService.getAllPermissions();

    return res.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    console.error('Get all permissions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mendapatkan daftar permission'
    });
  }
};

module.exports = {
  getUserAccess,
  checkAccess,
  getAllFeatures,
  getAllPermissions
};
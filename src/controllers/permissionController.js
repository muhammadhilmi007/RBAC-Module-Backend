// src/controllers/permissionController.js
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { catchAsync } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Validasi untuk endpoint create dan update permission
 */
const permissionValidation = [
  body('name').notEmpty().withMessage('Nama permission tidak boleh kosong')
];

/**
 * Controller untuk mendapatkan semua permission
 */
const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await prisma.permission.findMany();

  return res.json({
    success: true,
    data: permissions
  });
});

/**
 * Controller untuk mendapatkan permission berdasarkan ID
 */
const getPermissionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const permission = await prisma.permission.findUnique({
    where: { id: Number(id) }
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission tidak ditemukan'
    });
  }

  return res.json({
    success: true,
    data: permission
  });
});

/**
 * Controller untuk membuat permission baru
 */
const createPermission = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name } = req.body;

  // Cek apakah permission dengan nama tersebut sudah ada
  const existingPermission = await prisma.permission.findUnique({
    where: { name }
  });

  if (existingPermission) {
    return res.status(400).json({
      success: false,
      message: 'Permission dengan nama tersebut sudah ada'
    });
  }

  // Buat permission baru
  const permission = await prisma.permission.create({
    data: { name }
  });

  return res.status(201).json({
    success: true,
    message: 'Permission berhasil dibuat',
    data: permission
  });
});

/**
 * Controller untuk mengupdate permission
 */
const updatePermission = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { name } = req.body;

  // Cek apakah permission ada
  const permission = await prisma.permission.findUnique({
    where: { id: Number(id) }
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission tidak ditemukan'
    });
  }

  // Cek apakah nama permission sudah digunakan oleh permission lain
  if (name !== permission.name) {
    const existingPermission = await prisma.permission.findUnique({
      where: { name }
    });

    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission dengan nama tersebut sudah ada'
      });
    }
  }

  // Update permission
  const updatedPermission = await prisma.permission.update({
    where: { id: Number(id) },
    data: { name }
  });

  return res.json({
    success: true,
    message: 'Permission berhasil diupdate',
    data: updatedPermission
  });
});

/**
 * Controller untuk menghapus permission
 */
const deletePermission = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Cek apakah permission ada
  const permission = await prisma.permission.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: { acl: true }
      }
    }
  });

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: 'Permission tidak ditemukan'
    });
  }

  // Cek apakah permission masih digunakan di ACL
  if (permission._count.acl > 0) {
    return res.status(400).json({
      success: false,
      message: 'Permission masih digunakan dalam ACL, hapus dari ACL terlebih dahulu'
    });
  }

  // Hapus permission
  await prisma.permission.delete({
    where: { id: Number(id) }
  });

  return res.json({
    success: true,
    message: 'Permission berhasil dihapus'
  });
});

module.exports = {
  permissionValidation,
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
};
// src/controllers/featureController.js
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { catchAsync } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Validasi untuk endpoint create dan update feature
 */
const featureValidation = [
  body('name').notEmpty().withMessage('Nama fitur tidak boleh kosong'),
  body('route').optional(),
  body('icon').optional()
];

/**
 * Controller untuk mendapatkan semua fitur
 */
const getAllFeatures = catchAsync(async (req, res) => {
  const features = await prisma.feature.findMany();

  return res.json({
    success: true,
    data: features
  });
});

/**
 * Controller untuk mendapatkan fitur berdasarkan ID
 */
const getFeatureById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const feature = await prisma.feature.findUnique({
    where: { id: Number(id) }
  });

  if (!feature) {
    return res.status(404).json({
      success: false,
      message: 'Fitur tidak ditemukan'
    });
  }

  return res.json({
    success: true,
    data: feature
  });
});

/**
 * Controller untuk membuat fitur baru
 */
const createFeature = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, route, icon } = req.body;

  // Cek apakah fitur dengan nama tersebut sudah ada
  const existingFeature = await prisma.feature.findUnique({
    where: { name }
  });

  if (existingFeature) {
    return res.status(400).json({
      success: false,
      message: 'Fitur dengan nama tersebut sudah ada'
    });
  }

  // Buat fitur baru
  const feature = await prisma.feature.create({
    data: {
      name,
      route,
      icon
    }
  });

  return res.status(201).json({
    success: true,
    message: 'Fitur berhasil dibuat',
    data: feature
  });
});

/**
 * Controller untuk mengupdate fitur
 */
const updateFeature = catchAsync(async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { name, route, icon } = req.body;

  // Cek apakah fitur ada
  const feature = await prisma.feature.findUnique({
    where: { id: Number(id) }
  });

  if (!feature) {
    return res.status(404).json({
      success: false,
      message: 'Fitur tidak ditemukan'
    });
  }

  // Cek apakah nama fitur sudah digunakan oleh fitur lain
  if (name && name !== feature.name) {
    const existingFeature = await prisma.feature.findUnique({
      where: { name }
    });

    if (existingFeature) {
      return res.status(400).json({
        success: false,
        message: 'Fitur dengan nama tersebut sudah ada'
      });
    }
  }

  // Update fitur
  const updatedFeature = await prisma.feature.update({
    where: { id: Number(id) },
    data: {
      name: name || feature.name,
      route: route !== undefined ? route : feature.route,
      icon: icon !== undefined ? icon : feature.icon
    }
  });

  return res.json({
    success: true,
    message: 'Fitur berhasil diupdate',
    data: updatedFeature
  });
});

/**
 * Controller untuk menghapus fitur
 */
const deleteFeature = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Cek apakah fitur ada
  const feature = await prisma.feature.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: { acl: true }
      }
    }
  });

  if (!feature) {
    return res.status(404).json({
      success: false,
      message: 'Fitur tidak ditemukan'
    });
  }

  // Cek apakah fitur masih digunakan di ACL
  if (feature._count.acl > 0) {
    return res.status(400).json({
      success: false,
      message: 'Fitur masih digunakan dalam ACL, hapus dari ACL terlebih dahulu'
    });
  }

  // Hapus fitur
  await prisma.feature.delete({
    where: { id: Number(id) }
  });

  return res.json({
    success: true,
    message: 'Fitur berhasil dihapus'
  });
});

module.exports = {
  featureValidation,
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature
};
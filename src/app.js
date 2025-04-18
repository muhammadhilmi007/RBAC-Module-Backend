// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const aclRoutes = require('./routes/aclRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const featureRoutes = require('./routes/featureRoutes');
const permissionRoutes = require('./routes/permissionRoutes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/acl', aclRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/permissions', permissionRoutes);

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler middleware
app.use(errorHandler);

// Route not found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;
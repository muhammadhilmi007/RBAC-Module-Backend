// src/utils/errorHandler.js

/**
 * Class untuk menangani error pada aplikasi
 */
class AppError extends Error {
    /**
     * @param {string} message - Pesan error
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Middleware untuk handling error
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    // Jika dalam mode development, kembalikan stack trace
    const isDev = process.env.NODE_ENV === 'development';
  
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: isDev ? err.stack : undefined,
      error: err
    });
  };
  
  /**
   * Function untuk catching async errors
   * @param {Function} fn - Async function yang mungkin throw error
   */
  const catchAsync = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  module.exports = {
    AppError,
    errorHandler,
    catchAsync
  };
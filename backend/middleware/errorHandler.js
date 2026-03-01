import { errorResponse } from '../utils/response.js';

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(
    errorResponse(message, {
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
  );
};

export default errorHandler;

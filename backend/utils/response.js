/**
 * Format success response
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @returns {object} Formatted response
 */
export const successResponse = (message = 'Success', data = null) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {any} error - Error details
 * @returns {object} Formatted response
 */
export const errorResponse = (message = 'Error', error = null) => {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  };
};

const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(statusCode, message, details = null, code = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

const errorResponse = (err) => ({
  error: {
    code: err.code || 'API_ERROR',
    message: err.message || 'Unknown error',
    details: err.details || null,
  },
});

module.exports = { ApiError, errorResponse, StatusCodes };

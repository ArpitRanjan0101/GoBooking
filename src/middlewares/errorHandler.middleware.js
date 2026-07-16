const AppError = require('../errors/AppError');
const errorResponse = require('../responses/errorResponse');
const HTTP_STATUS = require('../constants/http-status.constant');
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return errorResponse(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err && err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return errorResponse(res, { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Validation failed', errors });
  }

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return errorResponse(res, {
      statusCode: HTTP_STATUS.CONFLICT,
      message: `${field} already exists`,
      errors: [{ field, message: `${field} must be unique` }],
    });
  }

  console.error(err);

  return errorResponse(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    errors: [],
  });
}

module.exports = errorHandler;

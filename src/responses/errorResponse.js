function errorResponse(res, { statusCode = 500, message = 'Internal Server Error', errors = [] } = {}) {
  return res.status(statusCode).json({ success: false, message, errors });
}

module.exports = errorResponse;

const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errors = []) {
    super(message, 404, errors);
  }
}

module.exports = NotFoundError;

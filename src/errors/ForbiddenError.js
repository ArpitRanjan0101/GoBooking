const AppError = require('./AppError');

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errors = []) {
    super(message, 403, errors);
  }
}

module.exports = ForbiddenError;

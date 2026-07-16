const AppError = require('./AppError');

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errors = []) {
    super(message, 401, errors);
  }
}

module.exports = UnauthorizedError;

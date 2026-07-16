const AppError = require('./AppError');

class ConflictError extends AppError {
  constructor(message = 'Conflict', errors = []) {
    super(message, 409, errors);
  }
}

module.exports = ConflictError;

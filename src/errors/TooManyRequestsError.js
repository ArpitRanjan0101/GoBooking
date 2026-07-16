const AppError = require('./AppError');

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', errors = []) {
    super(message, 429, errors);
  }
}

module.exports = TooManyRequestsError;

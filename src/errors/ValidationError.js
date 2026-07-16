const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(errors = [], message = 'Validation failed') {
    super(message, 400, errors);
  }
}

module.exports = ValidationError;

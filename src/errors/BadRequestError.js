const AppError = require('./AppError');

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = []) {
    super(message, 400, errors);
  }
}

module.exports = BadRequestError;

const ValidationError = require('../errors/ValidationError');

class ValidationCollector {
  constructor() {
    this.errors = [];
  }

  check(condition, field, message) {
    if (!condition) this.errors.push({ field, message });
    return this;
  }

  throwIfErrors() {
    if (this.errors.length > 0) throw new ValidationError(this.errors);
  }
}

module.exports = ValidationCollector;

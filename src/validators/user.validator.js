const ValidationCollector = require('./validationCollector');
const common = require('./common.validator');

function validateUpdateProfile(req, res, next) {
  const { firstName, lastName } = req.body;
  const v = new ValidationCollector();

  if (firstName !== undefined) {
    v.check(common.isNonEmptyString(firstName), 'firstName', 'First name cannot be empty');
  }
  if (lastName !== undefined) {
    v.check(common.isNonEmptyString(lastName), 'lastName', 'Last name cannot be empty');
  }
  v.check(firstName !== undefined || lastName !== undefined, 'body', 'At least one field must be provided');

  v.throwIfErrors();
  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(currentPassword), 'currentPassword', 'Current password is required');
  v.check(
    common.isStrongPassword(newPassword),
    'newPassword',
    'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number'
  );

  v.throwIfErrors();
  next();
}

module.exports = { validateUpdateProfile, validateChangePassword };

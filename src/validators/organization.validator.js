const ValidationCollector = require('./validationCollector');
const common = require('./common.validator');

function validateUpdateOrganization(req, res, next) {
  const { name, email, phone } = req.body;
  const v = new ValidationCollector();

  if (name !== undefined) v.check(common.isNonEmptyString(name), 'name', 'Name cannot be empty');
  if (email !== undefined) v.check(common.isValidEmail(email), 'email', 'A valid email is required');
  if (phone !== undefined) v.check(common.isValidPhone(phone), 'phone', 'A valid phone number is required');
  v.check(
    name !== undefined || email !== undefined || phone !== undefined,
    'body',
    'At least one field must be provided'
  );

  v.throwIfErrors();
  if (email) req.body.email = email.trim().toLowerCase();
  next();
}

module.exports = { validateUpdateOrganization };

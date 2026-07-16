const ValidationCollector = require('./validationCollector');
const common = require('./common.validator');
const env = require('../config/env');

function validateRegister(req, res, next) {
  const { organizationName, firstName, lastName, email, phone, password } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(organizationName), 'organizationName', 'Organization name is required');
  v.check(common.isNonEmptyString(firstName), 'firstName', 'First name is required');
  v.check(common.isNonEmptyString(lastName), 'lastName', 'Last name is required');
  v.check(common.isValidEmail(email), 'email', 'A valid email is required');
  v.check(common.isValidPhone(phone), 'phone', 'A valid phone number is required');
  v.check(
    common.isStrongPassword(password),
    'password',
    'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number'
  );

  v.throwIfErrors();

  req.body = {
    organizationName: organizationName.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password,
  };
  next();
}

function validateVerifyRegistration(req, res, next) {
  const { userId, otp } = req.body;
  const v = new ValidationCollector();

  v.check(common.isValidObjectId(userId), 'userId', 'A valid userId is required');
  v.check(common.isValidOtp(otp, env.OTP_LENGTH), 'otp', `OTP must be exactly ${env.OTP_LENGTH} digits`);

  v.throwIfErrors();
  next();
}

function validateLogin(req, res, next) {
  const { identifier, password } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(identifier), 'identifier', 'Email or phone is required');
  v.check(common.isNonEmptyString(password), 'password', 'Password is required');

  v.throwIfErrors();
  req.body.identifier = identifier.trim().toLowerCase();
  next();
}

function validateRefreshToken(req, res, next) {
  const { refreshToken } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(refreshToken), 'refreshToken', 'refreshToken is required');

  v.throwIfErrors();
  next();
}

function validateForgotPassword(req, res, next) {
  const { identifier } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(identifier), 'identifier', 'Email or phone is required');

  v.throwIfErrors();
  req.body.identifier = identifier.trim().toLowerCase();
  next();
}

function validateResetPassword(req, res, next) {
  const { token, newPassword } = req.body;
  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(token), 'token', 'token is required');
  v.check(
    common.isStrongPassword(newPassword),
    'newPassword',
    'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number'
  );

  v.throwIfErrors();
  next();
}

module.exports = {
  validateRegister,
  validateVerifyRegistration,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
};

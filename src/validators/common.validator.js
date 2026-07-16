const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

function isValidPhone(value) {
  return typeof value === 'string' && PHONE_REGEX.test(value.trim());
}

function isStrongPassword(value) {
  return typeof value === 'string' && PASSWORD_REGEX.test(value);
}

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function isValidOtp(value, length) {
  const otpRegex = new RegExp(`^\\d{${length}}$`);
  return typeof value === 'string' && otpRegex.test(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEnum(value, enumObject) {
  return Object.values(enumObject).includes(value);
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidObjectId,
  isValidOtp,
  isNonEmptyString,
  isValidEnum,
};

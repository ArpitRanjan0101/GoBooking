const fs = require('fs');
const ValidationCollector = require('../../validators/validationCollector');
const common = require('../../validators/common.validator');
const BadRequestError = require('../../errors/BadRequestError');
const BUSINESS_TYPE = require('../../constants/businessType.constant');
const WORKING_DAYS = require('../../constants/workingDays.constant');
const { detectImageMimeType } = require('../../helpers/fileStorage.helper');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;

const UPDATABLE_FIELDS = [
  'business_name',
  'business_type',
  'description',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'country',
  'postal_code',
  'latitude',
  'longitude',
  'working_days',
  'open_time',
  'close_time',
];

const TRIMMABLE_STRING_FIELDS = [
  'business_name',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'country',
  'postal_code',
  'description',
];

function isValidTime(value) {
  return typeof value === 'string' && TIME_REGEX.test(value);
}

function isValidPostalCode(value) {
  return typeof value === 'string' && POSTAL_CODE_REGEX.test(value.trim());
}

function isValidLatitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidWorkingDays(value) {
  return (
    Array.isArray(value) && value.length > 0 && value.every((day) => common.isValidEnum(day, WORKING_DAYS))
  );
}

function isCloseAfterOpen(openTime, closeTime) {
  if (!isValidTime(openTime) || !isValidTime(closeTime)) return false;
  return closeTime > openTime;
}

function validateCreateProfile(req, res, next) {
  const {
    business_name: businessName,
    business_type: businessType,
    description,
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    city,
    state,
    country,
    postal_code: postalCode,
    latitude,
    longitude,
    working_days: workingDays,
    open_time: openTime,
    close_time: closeTime,
  } = req.body;

  const v = new ValidationCollector();

  v.check(common.isNonEmptyString(businessName), 'business_name', 'business_name is required');
  v.check(
    typeof businessName !== 'string' || businessName.trim().length <= 150,
    'business_name',
    'business_name must be at most 150 characters'
  );
  v.check(common.isValidEnum(businessType, BUSINESS_TYPE), 'business_type', 'A valid business_type is required');
  v.check(common.isNonEmptyString(addressLine1), 'address_line_1', 'address_line_1 is required');
  v.check(common.isNonEmptyString(city), 'city', 'city is required');
  v.check(common.isNonEmptyString(state), 'state', 'state is required');
  v.check(common.isNonEmptyString(country), 'country', 'country is required');
  v.check(isValidPostalCode(postalCode), 'postal_code', 'A valid postal_code is required');
  v.check(isValidWorkingDays(workingDays), 'working_days', 'working_days must be a non-empty array of valid days');
  v.check(isValidTime(openTime), 'open_time', 'open_time must be in HH:mm format');
  v.check(isValidTime(closeTime), 'close_time', 'close_time must be in HH:mm format');

  if (description !== undefined) {
    v.check(typeof description === 'string', 'description', 'description must be a string');
  }
  if (addressLine2 !== undefined) {
    v.check(typeof addressLine2 === 'string', 'address_line_2', 'address_line_2 must be a string');
  }
  if (latitude !== undefined) {
    v.check(isValidLatitude(latitude), 'latitude', 'latitude must be a number between -90 and 90');
  }
  if (longitude !== undefined) {
    v.check(isValidLongitude(longitude), 'longitude', 'longitude must be a number between -180 and 180');
  }

  v.throwIfErrors();

  req.body = {
    business_name: businessName.trim(),
    business_type: businessType,
    description: typeof description === 'string' ? description.trim() : undefined,
    address_line_1: addressLine1.trim(),
    address_line_2: typeof addressLine2 === 'string' ? addressLine2.trim() : undefined,
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    postal_code: postalCode.trim(),
    latitude,
    longitude,
    working_days: workingDays,
    open_time: openTime,
    close_time: closeTime,
  };
  next();
}

function validateUpdateProfile(req, res, next) {
  const body = req.body;
  const v = new ValidationCollector();

  const providedKeys = Object.keys(body).filter((key) => UPDATABLE_FIELDS.includes(key));
  v.check(providedKeys.length > 0, 'body', 'At least one field must be provided');

  if (body.business_name !== undefined) {
    v.check(common.isNonEmptyString(body.business_name), 'business_name', 'business_name cannot be empty');
    v.check(
      typeof body.business_name !== 'string' || body.business_name.trim().length <= 150,
      'business_name',
      'business_name must be at most 150 characters'
    );
  }
  if (body.business_type !== undefined) {
    v.check(common.isValidEnum(body.business_type, BUSINESS_TYPE), 'business_type', 'A valid business_type is required');
  }
  if (body.description !== undefined) {
    v.check(typeof body.description === 'string', 'description', 'description must be a string');
  }
  if (body.address_line_1 !== undefined) {
    v.check(common.isNonEmptyString(body.address_line_1), 'address_line_1', 'address_line_1 cannot be empty');
  }
  if (body.address_line_2 !== undefined) {
    v.check(typeof body.address_line_2 === 'string', 'address_line_2', 'address_line_2 must be a string');
  }
  if (body.city !== undefined) {
    v.check(common.isNonEmptyString(body.city), 'city', 'city cannot be empty');
  }
  if (body.state !== undefined) {
    v.check(common.isNonEmptyString(body.state), 'state', 'state cannot be empty');
  }
  if (body.country !== undefined) {
    v.check(common.isNonEmptyString(body.country), 'country', 'country cannot be empty');
  }
  if (body.postal_code !== undefined) {
    v.check(isValidPostalCode(body.postal_code), 'postal_code', 'A valid postal_code is required');
  }
  if (body.working_days !== undefined) {
    v.check(isValidWorkingDays(body.working_days), 'working_days', 'working_days must be a non-empty array of valid days');
  }
  if (body.open_time !== undefined) {
    v.check(isValidTime(body.open_time), 'open_time', 'open_time must be in HH:mm format');
  }
  if (body.close_time !== undefined) {
    v.check(isValidTime(body.close_time), 'close_time', 'close_time must be in HH:mm format');
  }
  if (body.latitude !== undefined) {
    v.check(isValidLatitude(body.latitude), 'latitude', 'latitude must be a number between -90 and 90');
  }
  if (body.longitude !== undefined) {
    v.check(isValidLongitude(body.longitude), 'longitude', 'longitude must be a number between -180 and 180');
  }

  v.throwIfErrors();

  TRIMMABLE_STRING_FIELDS.forEach((key) => {
    if (typeof body[key] === 'string') {
      req.body[key] = body[key].trim();
    }
  });

  next();
}

function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return next(new BadRequestError('No file was uploaded'));
  }
  if (req.file.size === 0) {
    // multer already wrote the file to disk before this middleware runs — clean up the orphan on rejection.
    fs.unlink(req.file.path, () => {});
    return next(new BadRequestError('Uploaded file is empty'));
  }

  // fileFilter only checked the client-supplied Content-Type header, which is trivially
  // spoofable. Confirm the actual file content is a real image before accepting it.
  const detectedType = detectImageMimeType(req.file.path);
  if (!detectedType) {
    fs.unlink(req.file.path, () => {});
    return next(new BadRequestError('File content does not match a valid JPEG, PNG, or WEBP image'));
  }

  next();
}

module.exports = {
  validateCreateProfile,
  validateUpdateProfile,
  validateUploadedFile,
  isCloseAfterOpen,
};

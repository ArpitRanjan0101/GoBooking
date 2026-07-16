const businessProfileRepository = require('./businessProfile.repository');
const organizationRepository = require('../organization/organization.repository');
const { ORGANIZATION_STATUS } = require('../../constants/status.constant');
const { pickAllowedFields } = require('../../utils/pick.util');
const { isCloseAfterOpen } = require('./businessProfile.validation');
const { buildFileUrl, deleteFileByUrl } = require('../../helpers/fileStorage.helper');
const NotFoundError = require('../../errors/NotFoundError');
const ConflictError = require('../../errors/ConflictError');
const ForbiddenError = require('../../errors/ForbiddenError');
const BadRequestError = require('../../errors/BadRequestError');

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

async function assertOrganizationActive(organizationId) {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) throw new NotFoundError('Organization not found');
  if (organization.status !== ORGANIZATION_STATUS.ACTIVE) {
    throw new ForbiddenError('Organization is not active');
  }
  return organization;
}

async function createProfile(organizationId, payload) {
  await assertOrganizationActive(organizationId);

  const existing = await businessProfileRepository.findByOrganizationId(organizationId);
  if (existing) throw new ConflictError('Business profile already exists for this organization');

  if (!isCloseAfterOpen(payload.open_time, payload.close_time)) {
    throw new BadRequestError('close_time must be after open_time');
  }

  try {
    return await businessProfileRepository.create({
      organization_id: organizationId,
      ...payload,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ConflictError('Business profile already exists for this organization');
    }
    throw err;
  }
}

async function getProfile(organizationId) {
  await assertOrganizationActive(organizationId);

  const profile = await businessProfileRepository.findByOrganizationId(organizationId);
  if (!profile) throw new NotFoundError('Business profile not found');
  return profile;
}

async function updateProfile(organizationId, payload) {
  await assertOrganizationActive(organizationId);

  const profile = await businessProfileRepository.findByOrganizationId(organizationId);
  if (!profile) throw new NotFoundError('Business profile not found');

  const updates = pickAllowedFields(payload, UPDATABLE_FIELDS);

  const nextOpenTime = updates.open_time || profile.open_time;
  const nextCloseTime = updates.close_time || profile.close_time;
  if (!isCloseAfterOpen(nextOpenTime, nextCloseTime)) {
    throw new BadRequestError('close_time must be after open_time');
  }

  return businessProfileRepository.updateByOrganizationId(organizationId, updates);
}

async function uploadLogo(organizationId, file) {
  await assertOrganizationActive(organizationId);

  const profile = await businessProfileRepository.findByOrganizationId(organizationId);
  if (!profile) throw new NotFoundError('Business profile not found');

  const logoUrl = buildFileUrl('logos', file.filename);
  const previousUrl = profile.logo_url;

  const updated = await businessProfileRepository.updateByOrganizationId(organizationId, { logo_url: logoUrl });
  deleteFileByUrl(previousUrl);

  return updated;
}

async function uploadCoverImage(organizationId, file) {
  await assertOrganizationActive(organizationId);

  const profile = await businessProfileRepository.findByOrganizationId(organizationId);
  if (!profile) throw new NotFoundError('Business profile not found');

  const coverUrl = buildFileUrl('covers', file.filename);
  const previousUrl = profile.cover_image_url;

  const updated = await businessProfileRepository.updateByOrganizationId(organizationId, {
    cover_image_url: coverUrl,
  });
  deleteFileByUrl(previousUrl);

  return updated;
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  uploadLogo,
  uploadCoverImage,
};

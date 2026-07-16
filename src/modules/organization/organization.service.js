const organizationRepository = require('./organization.repository');
const NotFoundError = require('../../errors/NotFoundError');
const ConflictError = require('../../errors/ConflictError');
const { pickAllowedFields } = require('../../utils/pick.util');

const UPDATABLE_FIELDS = ['name', 'email', 'phone'];

async function getOrganizationById(organizationId) {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) throw new NotFoundError('Organization not found');
  return organization;
}

async function updateOrganization(organizationId, payload) {
  const updates = pickAllowedFields(payload, UPDATABLE_FIELDS);

  if (updates.email) {
    const existing = await organizationRepository.findByEmail(updates.email);
    if (existing && existing._id.toString() !== organizationId.toString()) {
      throw new ConflictError('Email is already in use by another organization');
    }
  }
  if (updates.phone) {
    const existing = await organizationRepository.findByPhone(updates.phone);
    if (existing && existing._id.toString() !== organizationId.toString()) {
      throw new ConflictError('Phone is already in use by another organization');
    }
  }

  const organization = await organizationRepository.updateById(organizationId, updates);
  if (!organization) throw new NotFoundError('Organization not found');
  return organization;
}

module.exports = { getOrganizationById, updateOrganization };

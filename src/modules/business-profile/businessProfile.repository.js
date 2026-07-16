const BusinessProfile = require('./businessProfile.model');

async function create(data) {
  return BusinessProfile.create(data);
}

async function findByOrganizationId(organizationId) {
  return BusinessProfile.findOne({ organization_id: organizationId });
}

async function updateByOrganizationId(organizationId, updates) {
  return BusinessProfile.findOneAndUpdate({ organization_id: organizationId }, updates, {
    returnDocument: 'after',
    runValidators: true,
  });
}

module.exports = { create, findByOrganizationId, updateByOrganizationId };

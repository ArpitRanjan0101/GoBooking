const asyncHandler = require('../../utils/asyncHandler');
const organizationService = require('./organization.service');
const successResponse = require('../../responses/successResponse');
const HTTP_STATUS = require('../../constants/http-status.constant');

exports.getMyOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.getOrganizationById(req.user.organizationId);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Organization fetched successfully',
    data: { organization },
  });
});

exports.updateMyOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.updateOrganization(req.user.organizationId, req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Organization updated successfully',
    data: { organization },
  });
});

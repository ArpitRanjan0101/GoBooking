const asyncHandler = require('../../utils/asyncHandler');
const businessProfileService = require('./businessProfile.service');
const successResponse = require('../../responses/successResponse');
const HTTP_STATUS = require('../../constants/http-status.constant');

exports.createProfile = asyncHandler(async (req, res) => {
  const businessProfile = await businessProfileService.createProfile(req.user.organizationId, req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Business profile created successfully',
    data: { businessProfile },
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const businessProfile = await businessProfileService.getProfile(req.user.organizationId);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Business profile fetched successfully',
    data: { businessProfile },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const businessProfile = await businessProfileService.updateProfile(req.user.organizationId, req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Business profile updated successfully',
    data: { businessProfile },
  });
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  const businessProfile = await businessProfileService.uploadLogo(req.user.organizationId, req.file);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logo uploaded successfully',
    data: { logo_url: businessProfile.logo_url },
  });
});

exports.uploadCoverImage = asyncHandler(async (req, res) => {
  const businessProfile = await businessProfileService.uploadCoverImage(req.user.organizationId, req.file);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Cover image uploaded successfully',
    data: { cover_image_url: businessProfile.cover_image_url },
  });
});

const asyncHandler = require('../../utils/asyncHandler');
const userService = require('./user.service');
const successResponse = require('../../responses/successResponse');
const HTTP_STATUS = require('../../constants/http-status.constant');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile fetched successfully',
    data: { user },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile updated successfully',
    data: { user },
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Password changed successfully',
    data: null,
  });
});

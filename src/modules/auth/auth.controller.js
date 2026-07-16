const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');
const successResponse = require('../../responses/successResponse');
const HTTP_STATUS = require('../../constants/http-status.constant');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registration successful. OTP has been sent.',
    data: result,
  });
});

exports.verifyRegistration = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegistration(req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Account verified successfully',
    data: result,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
  const result = await authService.login(req.body, meta);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Login successful',
    data: result,
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Token refreshed successfully',
    data: result,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out from all devices successfully',
    data: null,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.identifier);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'If an account exists, password reset instructions have been sent',
    data: null,
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return successResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Password has been reset successfully',
    data: null,
  });
});

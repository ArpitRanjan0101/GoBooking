const express = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const rateLimiter = require('../../middlewares/rateLimiter.middleware');
const RATE_LIMITS = require('../../constants/rateLimit.constant');
const {
  validateRegister,
  validateVerifyRegistration,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
} = require('../../validators/auth.validator');

const router = express.Router();

router.post('/register', rateLimiter(RATE_LIMITS.REGISTER), validateRegister, authController.register);
router.post(
  '/verify-registration',
  rateLimiter(RATE_LIMITS.VERIFY_OTP),
  validateVerifyRegistration,
  authController.verifyRegistration
);
router.post('/login', rateLimiter(RATE_LIMITS.LOGIN), validateLogin, authController.login);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);
router.post('/logout', validateRefreshToken, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post(
  '/forgot-password',
  rateLimiter(RATE_LIMITS.FORGOT_PASSWORD),
  validateForgotPassword,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  rateLimiter(RATE_LIMITS.RESET_PASSWORD),
  validateResetPassword,
  authController.resetPassword
);

module.exports = router;

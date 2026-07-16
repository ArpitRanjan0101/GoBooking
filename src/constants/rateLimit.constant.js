const RATE_LIMITS = {
  REGISTER: { keyPrefix: 'register', windowSeconds: 3600, max: 5 },
  LOGIN: { keyPrefix: 'login', windowSeconds: 900, max: 10 },
  VERIFY_OTP: { keyPrefix: 'verify-otp', windowSeconds: 300, max: 10 },
  FORGOT_PASSWORD: { keyPrefix: 'forgot-password', windowSeconds: 3600, max: 5 },
  RESET_PASSWORD: { keyPrefix: 'reset-password', windowSeconds: 3600, max: 10 },
};

module.exports = RATE_LIMITS;

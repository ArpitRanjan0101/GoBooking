const redisKeys = {
  otpKey: (userId) => `otp:register:${userId}`,
  otpAttemptsKey: (userId) => `otp:register:attempts:${userId}`,
  resetTokenKey: (token) => `reset:token:${token}`,
  rateLimitKey: (scope, ip) => `ratelimit:${scope}:${ip}`,
};

module.exports = redisKeys;

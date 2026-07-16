const { getRedisClient } = require('../config/redis');
const redisKeys = require('../constants/redisKeys.constant');
const TooManyRequestsError = require('../errors/TooManyRequestsError');

function rateLimiter({ keyPrefix, windowSeconds, max }) {
  return async function rateLimiterMiddleware(req, res, next) {
    try {
      const redis = getRedisClient();
      const key = redisKeys.rateLimitKey(keyPrefix, req.ip);

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (current > max) {
        throw new TooManyRequestsError('Too many requests. Please try again later.');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = rateLimiter;

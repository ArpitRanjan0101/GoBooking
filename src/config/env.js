const dotenv = require('dotenv');

dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bookeasy',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL_SECONDS: Number(process.env.JWT_ACCESS_TTL_SECONDS) || 900,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_TTL_SECONDS: Number(process.env.JWT_REFRESH_TTL_SECONDS) || 604800,

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  OTP_LENGTH: Number(process.env.OTP_LENGTH) || 6,
  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS) || 300,
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS) || 5,

  RESET_PASSWORD_TTL_SECONDS: Number(process.env.RESET_PASSWORD_TTL_SECONDS) || 900,

  MAX_UPLOAD_SIZE_BYTES: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 5) * 1024 * 1024,
};

if (env.NODE_ENV === 'production') {
  const requiredInProduction = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = requiredInProduction.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = env;

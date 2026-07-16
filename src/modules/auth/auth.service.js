const mongoose = require('mongoose');
const organizationRepository = require('../organization/organization.repository');
const userRepository = require('../user/user.repository');
const sessionRepository = require('../session/session.repository');
const { getRedisClient } = require('../../config/redis');
const { hashPassword, comparePassword } = require('../../helpers/hash.helper');
const { generateOtp } = require('../../helpers/otp.helper');
const { generateRandomToken, sha256 } = require('../../helpers/token.helper');
const { generateSlug } = require('../../helpers/slug.helper');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../helpers/jwt.helper');
const ROLES = require('../../constants/roles.constant');
const { ORGANIZATION_STATUS, USER_STATUS } = require('../../constants/status.constant');
const redisKeys = require('../../constants/redisKeys.constant');
const env = require('../../config/env');
const ConflictError = require('../../errors/ConflictError');
const UnauthorizedError = require('../../errors/UnauthorizedError');
const ForbiddenError = require('../../errors/ForbiddenError');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

async function register({ organizationName, firstName, lastName, email, phone, password }) {
  const [existingEmail, existingPhone] = await Promise.all([
    userRepository.findByEmail(email),
    userRepository.findByPhone(phone),
  ]);
  if (existingEmail) throw new ConflictError('Email is already registered');
  if (existingPhone) throw new ConflictError('Phone is already registered');

  const passwordHash = await hashPassword(password);

  const session = await mongoose.startSession();
  let organization;
  let user;
  const MAX_SLUG_ATTEMPTS = 3;

  try {
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = generateSlug(organizationName);

      try {
        await session.withTransaction(async () => {
          organization = await organizationRepository.create(
            {
              name: organizationName,
              slug,
              email,
              phone,
              status: ORGANIZATION_STATUS.PENDING,
            },
            session
          );

          user = await userRepository.create(
            {
              organizationId: organization._id,
              firstName,
              lastName,
              email,
              phone,
              passwordHash,
              role: ROLES.OWNER,
              status: USER_STATUS.PENDING,
            },
            session
          );
        });
        break;
      } catch (err) {
        const duplicateField = err && err.code === 11000 ? Object.keys(err.keyPattern || {})[0] : null;

        // Slug collisions are an internal detail (random suffix clash), not a user input problem — retry with a fresh slug instead of surfacing it.
        if (duplicateField === 'slug' && attempt < MAX_SLUG_ATTEMPTS) {
          continue;
        }
        if (duplicateField === 'email') throw new ConflictError('Email is already registered');
        if (duplicateField === 'phone') throw new ConflictError('Phone is already registered');
        throw err;
      }
    }
  } finally {
    await session.endSession();
  }

  const otp = generateOtp(env.OTP_LENGTH);
  const redis = getRedisClient();
  await redis.set(redisKeys.otpKey(user._id.toString()), otp, { EX: env.OTP_TTL_SECONDS });

  if (env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP] userId=${user._id} otp=${otp}`);
  }

  return {
    userId: user._id,
    organizationId: organization._id,
    otpExpiresInSeconds: env.OTP_TTL_SECONDS,
  };
}

async function createSessionAndTokens(user, organization, meta = {}) {
  const sessionId = new mongoose.Types.ObjectId();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);

  const tokenPayload = {
    sub: user._id.toString(),
    organizationId: organization._id.toString(),
    role: user.role,
  };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ ...tokenPayload, sid: sessionId.toString() });

  await sessionRepository.create({
    _id: sessionId,
    userId: user._id,
    organizationId: organization._id,
    refreshTokenHash: sha256(refreshToken),
    userAgent: meta.userAgent || null,
    ip: meta.ip || null,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

async function verifyRegistration({ userId, otp }) {
  const redis = getRedisClient();
  const otpKey = redisKeys.otpKey(userId);
  const attemptsKey = redisKeys.otpAttemptsKey(userId);

  const storedOtp = await redis.get(otpKey);
  if (!storedOtp) {
    throw new BadRequestError('OTP has expired or was already used. Please request a new one.');
  }

  if (storedOtp !== otp) {
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, env.OTP_TTL_SECONDS);
    }
    if (attempts >= env.OTP_MAX_ATTEMPTS) {
      await redis.del(otpKey);
      await redis.del(attemptsKey);
      throw new BadRequestError('Too many invalid OTP attempts. Please register again.');
    }
    throw new BadRequestError('Invalid OTP');
  }

  await redis.del(otpKey);
  await redis.del(attemptsKey);

  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const organization = await organizationRepository.findById(user.organizationId);
  if (!organization) throw new NotFoundError('Organization not found');

  await organizationRepository.updateStatusById(organization._id, ORGANIZATION_STATUS.ACTIVE);
  const activatedUser = await userRepository.updateStatusById(user._id, USER_STATUS.ACTIVE);
  organization.status = ORGANIZATION_STATUS.ACTIVE;

  const tokens = await createSessionAndTokens(activatedUser, organization);

  return { ...tokens, user: activatedUser, organization };
}

async function login({ identifier, password }, meta = {}) {
  const user = await userRepository.findByEmailOrPhoneWithPassword(identifier);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Invalid credentials');

  if (user.status === USER_STATUS.PENDING) {
    throw new ForbiddenError('Account is pending verification. Please complete OTP verification.');
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ForbiddenError('Account is not active');
  }

  const organization = await organizationRepository.findById(user.organizationId);
  if (!organization) throw new NotFoundError('Organization not found');
  if (organization.status !== ORGANIZATION_STATUS.ACTIVE) {
    throw new ForbiddenError('Organization is not active');
  }

  const tokens = await createSessionAndTokens(user, organization, meta);
  await userRepository.updateLastLoginAt(user._id);

  return { ...tokens, user, organization };
}

async function refreshToken(rawRefreshToken) {
  const decoded = verifyRefreshToken(rawRefreshToken);

  const sessionDoc = await sessionRepository.findById(decoded.sid);
  if (!sessionDoc) throw new UnauthorizedError('Session not found. Please log in again.');

  if (sessionDoc.refreshTokenHash !== sha256(rawRefreshToken)) {
    await sessionRepository.deleteById(sessionDoc._id);
    throw new UnauthorizedError('Refresh token has already been used or is invalid');
  }

  if (sessionDoc.expiresAt.getTime() < Date.now()) {
    await sessionRepository.deleteById(sessionDoc._id);
    throw new UnauthorizedError('Refresh token has expired');
  }

  const user = await userRepository.findById(decoded.sub);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw new UnauthorizedError('Account is not active');
  }

  const tokenPayload = { sub: user._id.toString(), organizationId: decoded.organizationId, role: user.role };
  const newAccessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken({ ...tokenPayload, sid: sessionDoc._id.toString() });
  const newExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);

  await sessionRepository.updateTokenById(sessionDoc._id, sha256(newRefreshToken), newExpiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(rawRefreshToken) {
  try {
    const decoded = verifyRefreshToken(rawRefreshToken);
    await sessionRepository.deleteById(decoded.sid);
  } catch (err) {
    // Token already invalid/expired/unknown session - logout is idempotent regardless.
  }
}

async function logoutAll(userId) {
  await sessionRepository.deleteAllByUserId(userId);
}

async function forgotPassword(identifier) {
  let user = await userRepository.findByEmail(identifier);
  if (!user) {
    user = await userRepository.findByPhone(identifier);
  }

  if (user) {
    const token = generateRandomToken(32);
    const redis = getRedisClient();
    await redis.set(redisKeys.resetTokenKey(token), user._id.toString(), {
      EX: env.RESET_PASSWORD_TTL_SECONDS,
    });

    if (env.NODE_ENV !== 'production') {
      console.log(`[DEV RESET TOKEN] userId=${user._id} token=${token}`);
    }
  }
}

async function resetPassword({ token, newPassword }) {
  const redis = getRedisClient();
  const key = redisKeys.resetTokenKey(token);
  const userId = await redis.get(key);

  if (!userId) throw new BadRequestError('Reset token is invalid or has expired');

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHash(userId, passwordHash);
  await redis.del(key);
  await sessionRepository.deleteAllByUserId(userId);
}

module.exports = {
  register,
  verifyRegistration,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
};

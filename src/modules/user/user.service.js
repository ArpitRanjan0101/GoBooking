const userRepository = require('./user.repository');
const NotFoundError = require('../../errors/NotFoundError');
const UnauthorizedError = require('../../errors/UnauthorizedError');
const { hashPassword, comparePassword } = require('../../helpers/hash.helper');
const { pickAllowedFields } = require('../../utils/pick.util');

const UPDATABLE_FIELDS = ['firstName', 'lastName'];

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function updateProfile(userId, payload) {
  const updates = pickAllowedFields(payload, UPDATABLE_FIELDS);
  const user = await userRepository.updateById(userId, updates);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw new NotFoundError('User not found');

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHash(userId, passwordHash);
}

module.exports = { getProfile, updateProfile, changePassword };

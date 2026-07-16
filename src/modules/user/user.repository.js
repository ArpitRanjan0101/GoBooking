const User = require('./user.model');

async function create(data, session) {
  const docs = await User.create([data], { session });
  return docs[0];
}

async function findById(id) {
  return User.findOne({ _id: id, deletedAt: null });
}

async function findByIdWithPassword(id) {
  return User.findOne({ _id: id, deletedAt: null }).select('+passwordHash');
}

async function findByEmail(email) {
  return User.findOne({ email, deletedAt: null });
}

async function findByPhone(phone) {
  return User.findOne({ phone, deletedAt: null });
}

async function findByEmailOrPhoneWithPassword(identifier) {
  return User.findOne({
    deletedAt: null,
    $or: [{ email: identifier }, { phone: identifier }],
  }).select('+passwordHash');
}

async function updateStatusById(id, status, session) {
  return User.findByIdAndUpdate(id, { status }, { returnDocument: 'after', session });
}

async function updateById(id, updates) {
  return User.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
}

async function updateLastLoginAt(id) {
  return User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
}

async function updatePasswordHash(id, passwordHash) {
  return User.findByIdAndUpdate(id, { passwordHash });
}

module.exports = {
  create,
  findById,
  findByIdWithPassword,
  findByEmail,
  findByPhone,
  findByEmailOrPhoneWithPassword,
  updateStatusById,
  updateById,
  updateLastLoginAt,
  updatePasswordHash,
};

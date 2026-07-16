const Session = require('./session.model');

async function create(data) {
  return Session.create(data);
}

async function findById(id) {
  return Session.findById(id);
}

async function updateTokenById(id, refreshTokenHash, expiresAt) {
  return Session.findByIdAndUpdate(id, { refreshTokenHash, expiresAt }, { returnDocument: 'after' });
}

async function deleteById(id) {
  return Session.findByIdAndDelete(id);
}

async function deleteAllByUserId(userId) {
  return Session.deleteMany({ userId });
}

module.exports = {
  create,
  findById,
  updateTokenById,
  deleteById,
  deleteAllByUserId,
};

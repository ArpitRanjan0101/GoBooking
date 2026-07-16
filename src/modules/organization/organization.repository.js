const Organization = require('./organization.model');

async function create(data, session) {
  const docs = await Organization.create([data], { session });
  return docs[0];
}

async function findById(id) {
  return Organization.findOne({ _id: id, deletedAt: null });
}

async function findByEmail(email) {
  return Organization.findOne({ email, deletedAt: null });
}

async function findByPhone(phone) {
  return Organization.findOne({ phone, deletedAt: null });
}

async function updateStatusById(id, status, session) {
  return Organization.findByIdAndUpdate(id, { status }, { returnDocument: 'after', session });
}

async function updateById(id, updates) {
  return Organization.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
}

module.exports = {
  create,
  findById,
  findByEmail,
  findByPhone,
  updateStatusById,
  updateById,
};

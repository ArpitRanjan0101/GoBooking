const { verifyAccessToken } = require('../helpers/jwt.helper');
const userRepository = require('../modules/user/user.repository');
const UnauthorizedError = require('../errors/UnauthorizedError');
const { USER_STATUS } = require('../constants/status.constant');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const decoded = verifyAccessToken(token);

  const user = await userRepository.findById(decoded.sub);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw new UnauthorizedError('Account is not active');
  }

  req.user = {
    id: user._id.toString(),
    organizationId: user.organizationId.toString(),
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  next();
});

const ForbiddenError = require('../errors/ForbiddenError');

function authorize(...allowedRoles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = authorize;

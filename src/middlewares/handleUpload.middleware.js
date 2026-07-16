const BadRequestError = require('../errors/BadRequestError');

function handleUpload(multerMiddleware) {
  return function handleUploadMiddleware(req, res, next) {
    multerMiddleware(req, res, (err) => {
      if (err) {
        return next(new BadRequestError(err.message || 'File upload failed'));
      }
      next();
    });
  };
}

module.exports = handleUpload;

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('./env');

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const LOGO_DIR = path.join(UPLOAD_ROOT, 'logos');
const COVER_DIR = path.join(UPLOAD_ROOT, 'covers');

[LOGO_DIR, COVER_DIR].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Keyed by the validated MIME type, never the client-supplied filename — a client
// could otherwise name a file "evil.html" and have it saved (and served back by
// express.static) with a .html extension despite fileFilter approving its mimetype.
const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function createStorage(destination) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destination),
    filename: (req, file, cb) => {
      const ext = MIME_TO_EXTENSION[file.mimetype];
      cb(null, `${req.user.organizationId}-${Date.now()}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
  }
  cb(null, true);
}

const logoUpload = multer({
  storage: createStorage(LOGO_DIR),
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
});

const coverUpload = multer({
  storage: createStorage(COVER_DIR),
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
});

module.exports = { logoUpload, coverUpload, UPLOAD_ROOT };

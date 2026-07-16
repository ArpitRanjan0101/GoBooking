const fs = require('fs');
const path = require('path');
const { UPLOAD_ROOT } = require('../config/upload.config');

function buildFileUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}

function deleteFileByUrl(url) {
  if (!url) return;
  const relativePath = url.replace(/^\/uploads\//, '');
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  fs.unlink(absolutePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to delete old file at ${absolutePath}:`, err.message);
    }
  });
}

function detectImageMimeType(filePath) {
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buffer, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

module.exports = { buildFileUrl, deleteFileByUrl, detectImageMimeType };

const express = require('express');
const businessProfileController = require('./businessProfile.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const handleUpload = require('../../middlewares/handleUpload.middleware');
const { logoUpload, coverUpload } = require('../../config/upload.config');
const {
  validateCreateProfile,
  validateUpdateProfile,
  validateUploadedFile,
} = require('./businessProfile.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', validateCreateProfile, businessProfileController.createProfile);
router.get('/', businessProfileController.getProfile);
router.put('/', validateUpdateProfile, businessProfileController.updateProfile);
router.post(
  '/logo',
  handleUpload(logoUpload.single('logo')),
  validateUploadedFile,
  businessProfileController.uploadLogo
);
router.post(
  '/cover-image',
  handleUpload(coverUpload.single('coverImage')),
  validateUploadedFile,
  businessProfileController.uploadCoverImage
);

module.exports = router;

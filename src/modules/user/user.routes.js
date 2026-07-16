const express = require('express');
const userController = require('./user.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { validateUpdateProfile, validateChangePassword } = require('../../validators/user.validator');

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/me', validateUpdateProfile, userController.updateProfile);
router.post('/me/change-password', validateChangePassword, userController.changePassword);

module.exports = router;

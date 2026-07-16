const express = require('express');
const organizationController = require('./organization.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { validateUpdateOrganization } = require('../../validators/organization.validator');
const ROLES = require('../../constants/roles.constant');

const router = express.Router();

router.use(authenticate);

router.get('/me', organizationController.getMyOrganization);
router.patch('/me', authorize(ROLES.OWNER), validateUpdateOrganization, organizationController.updateMyOrganization);

module.exports = router;

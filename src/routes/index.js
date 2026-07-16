const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const organizationRoutes = require('../modules/organization/organization.routes');
const businessProfileRoutes = require('../modules/business-profile/businessProfile.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/business-profile', businessProfileRoutes);

module.exports = router;

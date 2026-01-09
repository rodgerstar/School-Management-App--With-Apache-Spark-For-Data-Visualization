const express = require('express');
const router = express.Router();

// Public
router.use('/register-tenant', require('./registerTenantRoutes'));

// Protected (mounted in index.js with jwtAuth)
router.use('/login', require('./loginroutes'));
router.use('/users', require('./usermanagementroutes'));


module.exports = router;
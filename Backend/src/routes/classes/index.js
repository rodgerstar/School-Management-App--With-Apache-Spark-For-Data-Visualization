// C:\software_development\Api\Backend\src\routes\classes\index.js
const express = require('express');
const router = express.Router();

// Import sub-routers
router.use('/', require('./classRoutes'));

module.exports = router;
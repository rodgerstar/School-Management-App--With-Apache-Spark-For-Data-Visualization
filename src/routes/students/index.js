// C:\software_development\Api\Backend\src\routes\students\index.js
const express = require('express');
const router = express.Router();

// Import sub-routers
router.use('/', require('./studentRoutes'));           // /api/students → main CRUD
// Later you can add:
// router.use('/fees', require('./feesRoutes'));
// router.use('/performance', require('./performanceRoutes'));

module.exports = router;
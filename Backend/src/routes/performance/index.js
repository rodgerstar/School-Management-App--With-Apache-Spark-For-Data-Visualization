// src/routes/performance/index.js
const express = require('express');
const router = express.Router();

router.use('/', require('./performanceroutes'));

module.exports = router;

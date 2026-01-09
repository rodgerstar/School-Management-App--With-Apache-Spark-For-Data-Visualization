const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Tenant = require('../../models/tenant');
const User = require('../../models/user');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(async (req, res) => {
  const { organizationName, adminName, adminEmail, adminPassword } = req.body;

  if (!organizationName || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tenantId = 'TEN-' + uuidv4().slice(0, 8);
  const userId = 'USR-' + uuidv4().slice(0, 8);

  // Create minimal tenant
  const tenant = new Tenant({
    tenantId,
    organizationName
  });
  await tenant.save();

  // Create superadmin with flag (no roleId)
  const superadmin = new User({
    userId,
    tenantId,
    branchId: null, // no branch yet
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    isSuperAdmin: true  // ← this gives full access
  });
  await superadmin.save();

  res.status(201).json({
    message: 'Tenant and superadmin created',
    tenantId,
    superadmin: {
      userId: superadmin.userId,
      name: superadmin.name,
      email: superadmin.email
    }
  });
}));

module.exports = router;
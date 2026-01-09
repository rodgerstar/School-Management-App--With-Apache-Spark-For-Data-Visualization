const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Tenant = require('../../models/tenant');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


// Register Tenant + First Superadmin (public route)
router.post('/register-tenant', asyncHandler(async (req, res) => {
  const { 
    organizationName, 
    adminName, 
    adminEmail, 
    adminPassword,
    branchName // optional first branch
  } = req.body;

  if (!organizationName || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'All admin and organization fields required' });
  }

  // Generate IDs
  const { v4: uuidv4 } = require('uuid');
  const tenantId = 'tenant-' + uuidv4().slice(0, 8);
  const userId = 'user-' + uuidv4().slice(0, 8);
  let branchId = null;

  // Create branches array
  const branches = [];
  if (branchName) {
    branchId = 'branch-' + uuidv4().slice(0, 8);
    branches.push({ branchId, name: branchName, location: '' });
  }

  // Create Tenant
  const tenant = new Tenant({
    tenantId,
    organizationName,
    branches,
    isMultiBranch: branches.length > 1
  });
  await tenant.save();

  // Create Superadmin User
  const superadmin = new User({
    userId,
    tenantId,
    branchId: branchId || null,  // null if no branch yet
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'superadmin'
  });
  await superadmin.save();

  res.status(201).json({
    message: 'Tenant and superadmin created successfully',
    tenant: {
      tenantId,
      organizationName,
      isMultiBranch: tenant.isMultiBranch,
      branches: tenant.branches
    },
    superadmin: {
      userId: superadmin.userId,
      name: superadmin.name,
      email: superadmin.email,
      role: superadmin.role
    }
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check tenant exists
  const tenant = await Tenant.findOne({ tenantId: user.tenantId });
  if (!tenant) {
    return res.status(403).json({ error: 'Tenant not found' });
  }

  // If multi-branch and user not superadmin → must have branchId
  if (tenant.isMultiBranch && user.role !== 'superadmin' && !user.branchId) {
    return res.status(403).json({ error: 'Branch required' });
  }

  // Generate JWT (expires in 1 hour)
  const token = jwt.sign(
    {
      userId: user.userId,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.role
    },
    process.env.JWT_SECRET,  // We'll add this to .env
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId
    }
  });
}));

module.exports = router;
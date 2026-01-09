const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/user');
const Tenant = require('../../models/tenant');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const tenant = await Tenant.findOne({ tenantId: user.tenantId });
  if (!tenant) return res.status(403).json({ error: 'Tenant not found' });

  if (tenant.isMultiBranch && user.role !== 'superadmin' && !user.branchId) {
    return res.status(403).json({ error: 'Branch required' });
  }

  const token = jwt.sign(
    { userId: user.userId, tenantId: user.tenantId, branchId: user.branchId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, user: { name: user.name, role: user.role, tenantId: user.tenantId, branchId: user.branchId } });
}));

// Create User (protected)
router.post('/create-user', asyncHandler(async (req, res) => {
  const { tenantId, name, email, password, role, branchId } = req.body;

  if (!tenantId || !name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const userId = 'USR-' + uuidv4().slice(0, 8);

  const user = new User({
    userId,
    tenantId,
    branchId: branchId || null,
    name,
    email,
    password,
    role
  });
  await user.save();

  res.status(201).json({ message: 'User created', user });
}));

module.exports = router;
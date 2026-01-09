const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Tenant = require('../../models/tenant');

const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await User.findOne({ email }).populate('roleId');
if (!user || !(await user.comparePassword(password))) {
  return res.status(401).json({ error: 'Invalid email or password' });
}

const role = user.roleId;  // populated

  const tenant = await Tenant.findOne({ tenantId: user.tenantId });
  if (!tenant) {
    return res.status(403).json({ error: 'Tenant not found' });
  }

  // Branch check: only if tenant has branches and user is not superadmin
  if (tenant.branches && tenant.branches.length > 0 && !user.isSuperAdmin && !user.branchId) {
    return res.status(403).json({ error: 'Branch required for this organization' });
  }

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user.userId,
      tenantId: user.tenantId,
      branchId: user.branchId,
      isSuperAdmin: user.isSuperAdmin || false,
      roleId: user.roleId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: role ? {  // populate role if exists
      roleName: role.roleName,
      permissions: role.permissions
    } : null
    }
  });
}));

module.exports = router;
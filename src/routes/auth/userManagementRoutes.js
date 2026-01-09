const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/user');
const Role = require('../../models/roles');
const Student = require('../../models/student');
const Tenant = require('../../models/tenant');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(async (req, res) => {
  const { 
    tenantId, 
    branchId, 
    name, 
    email, 
    password, 
    baseRole,  // 'teacher', 'student', etc.
    roleId,    // optional — attach custom role
    extraData = {} 
  } = req.body;

  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  if (roleId) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) return res.status(404).json({ error: 'Role not found' });
  }

  const userId = 'USR-' + uuidv4().slice(0, 8);

  const user = new User({
    userId,
    tenantId,
    branchId: branchId || null,
    name,
    email,
    password,
    baseRole,
    roleId: roleId || null
  });
  await user.save();

  // Create role-specific data
  if (baseRole === 'student') {
    const student = new Student({
      userId: user._id,
      ...extraData
    });
    await student.save();
  }
  // Add teacher, staff later

  res.status(201).json({ message: 'User created', user });
}));

// List users
router.get('/', asyncHandler(async (req, res) => {
  const { tenantId } = req.user;
  const users = await User.find({ tenantId }).select('-password').populate('roleId');
  res.json(users);
}));

module.exports = router;
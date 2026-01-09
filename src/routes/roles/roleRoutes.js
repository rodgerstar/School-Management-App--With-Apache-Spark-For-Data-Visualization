const express = require('express');
const router = express.Router();
const Role = require('../../models/roles');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Create Role
router.post('/', asyncHandler(async (req, res) => {
  const { tenantId, roleName, permissions } = req.body;

  if (!tenantId || !roleName || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const role = new Role({ tenantId, roleName, permissions });
  await role.save();

  res.status(201).json({ message: 'Role created', role });
}));

// List Roles for Tenant
router.get('/', asyncHandler(async (req, res) => {
  const { tenantId } = req.user;
  const roles = await Role.find({ tenantId });
  res.json(roles);
}));

// Update Role Permissions
router.put('/:id', asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  const { tenantId } = req.user;

  const role = await Role.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { permissions },
    { new: true }
  );

  if (!role) return res.status(404).json({ error: 'Role not found' });

  res.json({ message: 'Role updated', role });
}));

module.exports = router;
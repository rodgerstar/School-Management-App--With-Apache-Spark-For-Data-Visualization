const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Branch = require('../../models/branches');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(async (req, res) => {
  const { tenantId, name, location = '' } = req.body;

  if (req.user.isSuperAdmin === false || req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Only superadmin can create branches' });
  }

  const branchId = 'BRN-' + uuidv4().slice(0, 8);

  const branch = new Branch({
    branchId,
    tenantId,
    name,
    location
  });
  await branch.save();

  res.status(201).json({ message: 'Branch created', branch });
}));

// List branches
router.get('/', asyncHandler(async (req, res) => {
  const branches = await Branch.find({ tenantId: req.user.tenantId });
  res.json(branches);
}));

module.exports = router;
// C:\software_development\Api\Backend\src\routes\classes\classRoutes.js
const express = require('express');
const router = express.Router();
const Class = require('../../models/classes');
const { checkPermission } = require('../../middleware/permissionCheck');

const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// List all classes (tenant + branch isolated)
router.get('/', checkPermission('classes', 'canView'), asyncHandler(async (req, res) => {
  let filter = { tenantId: req.user.tenantId };

  // Branch filter for non-superadmin
  if (!req.user.isSuperAdmin && req.user.branchId) {
    filter.branchId = req.user.branchId;
  }

  const { year, formLevel, stream } = req.query;
  if (year) filter.year = parseInt(year);
  if (formLevel) filter.formLevel = parseInt(formLevel);
  if (stream) filter.stream = stream;

  const classes = await Class.find(filter)
    .populate('teacherId', 'name email')
    .sort({ formLevel: 1, stream: 1 });

  res.json(classes);
}));

// Get single class
router.get('/:id', checkPermission('classes', 'canView'), asyncHandler(async (req, res) => {
  const classData = await Class.findOne({ 
    _id: req.params.id, 
    tenantId: req.user.tenantId 
  }).populate('teacherId', 'name email');

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.json(classData);
}));

// Create class
router.post('/', checkPermission('classes', 'canAdd'), asyncHandler(async (req, res) => {
  const { name, formLevel, stream, year, teacherId } = req.body;

  // Generate classId (you can customize this format)
  const classId = `CLS-${req.user.tenantId.slice(0, 4)}-${Date.now()}`;

  const classData = new Class({
    classId,
    tenantId: req.user.tenantId,
    branchId: req.user.branchId || req.body.branchId || null,
    name,
    formLevel,
    stream: stream || null,
    year,
    teacherId: teacherId || null
  });

  await classData.save();

  const populated = await Class.findById(classData._id)
    .populate('teacherId', 'name email');

  res.status(201).json(populated);
}));

// Update class - FIXED: changed canUpdate to canEdit
router.put('/:id', checkPermission('classes', 'canEdit'), asyncHandler(async (req, res) => {
  const { name, formLevel, stream, year, teacherId } = req.body;

  const classData = await Class.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { name, formLevel, stream, year, teacherId },
    { new: true, runValidators: true }
  ).populate('teacherId', 'name email');

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.json(classData);
}));

// Delete class
router.delete('/:id', checkPermission('classes', 'canDelete'), asyncHandler(async (req, res) => {
  const classData = await Class.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user.tenantId
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.status(204).send();
}));

module.exports = router;
// C:\software_development\Api\Backend\src\routes\students\studentRoutes.js
// IMPROVED VERSION - Auto-creates user account for student

const express = require('express');
const router = express.Router();
const Student = require('../../models/student');
const User = require('../../models/user');
const Role = require('../../models/roles');
const bcrypt = require('bcryptjs');
const { checkPermission } = require('../../middleware/permissionCheck');

const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// List all students (tenant + branch isolated)
router.get('/', checkPermission('students', 'canView'), asyncHandler(async (req, res) => {
  let filter = { tenantId: req.user.tenantId };

  // Branch filter for non-superadmin
  if (!req.user.isSuperAdmin && req.user.branchId) {
    filter.branchId = req.user.branchId;
  }

  // Role-based filter (Parent sees own kids, Student sees own class)
  if (!req.user.isSuperAdmin && req.user.roleId) {
    const role = typeof req.user.roleId === 'object' ? req.user.roleId : await Role.findById(req.user.roleId);
    if (role && role.roleName === 'Parent') {
      filter.parentId = req.user.userId;
    }
  }

  const students = await Student.find(filter)
    .populate('classId', 'name formLevel stream')
    .populate('userId', 'name email')
    .sort({ name: 1 });

  res.json(students);
}));

// Get single student
router.get('/:id', checkPermission('students', 'canView'), asyncHandler(async (req, res) => {
  let filter = { 
    _id: req.params.id, 
    tenantId: req.user.tenantId 
  };

  // Parent can only see own kid
  if (!req.user.isSuperAdmin && req.user.roleId) {
    const role = typeof req.user.roleId === 'object' ? req.user.roleId : await Role.findById(req.user.roleId);
    if (role && role.roleName === 'Parent') {
      filter.parentId = req.user.userId;
    }
  }

  const student = await Student.findOne(filter)
    .populate('classId')
    .populate('userId', 'name email')
    .populate('parentId', 'name email phone');

  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
}));

// Create student with auto-generated user account
router.post('/', checkPermission('students', 'canAdd'), asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password,
    classId,
    admissionNumber,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    guardianEmail,
    createUserAccount  // Optional flag: true/false
  } = req.body;

  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Student name is required' });
  }

  // Generate studentId
  const studentId = `STU-${req.user.tenantId.slice(0, 4)}-${Date.now()}`;

  let userId = null;

  // Create user account if requested and email/password provided
  if (createUserAccount !== false && email && password) {
    // Find Student role
    const studentRole = await Role.findOne({ 
      tenantId: req.user.tenantId, 
      roleName: 'Student' 
    });

    if (!studentRole) {
      return res.status(400).json({ 
        error: 'Student role not found. Please create a Student role first.' 
      });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userId: `USR-${Date.now()}`,
      tenantId: req.user.tenantId,
      branchId: req.user.branchId || null,
      name,
      email,
      password: hashedPassword,
      roleId: studentRole._id,
      isActive: true
    });

    await newUser.save();
    userId = newUser._id;
  }

  // Create student record
  const studentData = new Student({
    studentId,
    userId,
    tenantId: req.user.tenantId,
    branchId: req.user.branchId || null,
    classId: classId || null,
    name,
    email,
    admissionNumber,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    guardianEmail
  });

  await studentData.save();

  const populated = await Student.findById(studentData._id)
    .populate('classId', 'name formLevel stream')
    .populate('userId', 'name email');

  res.status(201).json(populated);
}));

// Update student
router.put('/:id', checkPermission('students', 'canEdit'), asyncHandler(async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    req.body,
    { new: true, runValidators: true }
  )
  .populate('classId', 'name formLevel stream')
  .populate('userId', 'name email');

  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
}));

// Delete student
router.delete('/:id', checkPermission('students', 'canDelete'), asyncHandler(async (req, res) => {
  const student = await Student.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user.tenantId
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });
  
  // Optionally delete associated user account
  if (student.userId) {
    await User.findByIdAndDelete(student.userId);
  }

  res.status(204).send();
}));

module.exports = router;
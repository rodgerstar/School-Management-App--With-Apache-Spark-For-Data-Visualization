// C:\software_development\Api\Backend\src\models\student.js
// IMPROVED VERSION - Auto-generates userId

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Auto-generated: STU-xxx
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional - created automatically
  tenantId: { type: String, required: true },
  branchId: { type: String }, // null for HQ
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Can be null if not assigned yet
  
  // Student Details
  name: { type: String, required: true },
  email: { type: String },
  admissionNumber: { type: String, unique: true, sparse: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  
  // Guardian Details
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Parent user account
  guardianName: { type: String },
  guardianPhone: { type: String },
  guardianEmail: { type: String },
  
  // Academic
  admissionDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  }
}, { timestamps: true });

// Index for tenant isolation
studentSchema.index({ tenantId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, admissionNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);
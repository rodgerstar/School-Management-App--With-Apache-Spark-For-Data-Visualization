const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true },
  branchId: { type: String }, // null = HQ
  name: { type: String, required: true }, // "Form 1 Blue"
  formLevel: { type: Number, required: true }, // 1, 2, 3, 4
  stream: { type: String }, // "Blue", "Green", null if no stream
  year: { type: Number, required: true }, // 2026
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // class teacher
}, { timestamps: true });

// Unique class per tenant + year + name
classSchema.index({ tenantId: 1, year: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
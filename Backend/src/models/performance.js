const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true }, // "Term 1 2026"
  year: { type: Number, required: true },
  subject: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  grade: { type: String }, // A, B+, etc.
  remarks: String
}, { timestamps: true });

// Index for fast ranking
performanceSchema.index({ classId: 1, term: 1, year: 1 });
performanceSchema.index({ studentId: 1, term: 1, year: 1 });

module.exports = mongoose.model('Performance', performanceSchema);
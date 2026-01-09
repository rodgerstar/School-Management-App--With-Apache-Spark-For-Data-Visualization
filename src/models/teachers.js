const mongoose = require('mongoose');
const { isValidEmail } = require('../utils/validator');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  subjects: [{
    type: String
  }]
}, { timestamps: true });

teacherSchema.path('email').validate(function(value) {
  return isValidEmail(value);
}, 'Invalid email format');

module.exports = mongoose.model('Teacher', teacherSchema);
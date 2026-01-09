const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
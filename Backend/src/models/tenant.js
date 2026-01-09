const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  organizationName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
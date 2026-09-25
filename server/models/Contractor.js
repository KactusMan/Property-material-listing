import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
  contractorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  assignedProperties: [{ type: String }],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Contractor = mongoose.model('Contractor', contractorSchema);

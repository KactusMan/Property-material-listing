import mongoose from 'mongoose';

// A vendor (contractor) the business works with. Login accounts link to it through User.contractorId.
const contractorSchema = new mongoose.Schema({
  contractorId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  trade: { type: String, default: '' },
  notes: { type: String, default: '' },
  assignedProperties: [{ type: String }],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Contractor = mongoose.model('Contractor', contractorSchema);

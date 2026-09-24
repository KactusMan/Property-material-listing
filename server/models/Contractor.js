import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
  contractorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Contractor = mongoose.model('Contractor', contractorSchema);

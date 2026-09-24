import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  propertyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Property = mongoose.model('Property', propertySchema);

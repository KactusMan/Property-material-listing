import mongoose from 'mongoose';

// A material a vendor found: either a new catalogue item or a better price for an existing one.
// Nothing reaches the catalogue until an administrator approves it.
const suggestionSchema = new mongoose.Schema({
  suggestionId: { type: String, required: true, unique: true },
  kind: { type: String, enum: ['new', 'price'], required: true },
  productId: { type: String, default: '' },
  currentPrice: { type: Number, default: null },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  unit: { type: String, default: 'each' },
  details: { type: String, default: '' },
  supplierLink: { type: String, default: '' },
  store: { type: String, default: '' },
  price: { type: Number, required: true },
  notes: { type: String, default: '' },
  submittedBy: {
    userId: String,
    name: String,
    email: String,
    contractorId: String
  },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewNote: { type: String, default: '' },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  resultProductId: { type: String, default: '' }
}, {
  timestamps: true
});

export const Suggestion = mongoose.model('Suggestion', suggestionSchema);

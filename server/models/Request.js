import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  expectedPrice: { type: Number, required: true },
  estimatedTotal: { type: Number, required: true }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  contractorId: { type: String, default: '' },
  contractorName: { type: String, required: true },
  contractorEmail: { type: String, default: '' },
  propertyId: { type: String, default: '' },
  propertyName: { type: String, required: true },
  propertyAddress: { type: String, default: '' },
  notes: { type: String, default: '' },
  estimatedTotal: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Rejected'],
    default: 'Submitted'
  },
  items: [requestItemSchema]
}, {
  timestamps: true
});

export const Request = mongoose.model('Request', requestSchema);

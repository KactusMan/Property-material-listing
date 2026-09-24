import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, default: 'each' },
  details: { type: String, default: '' },
  supplierLink: { type: String, default: '' },
  expectedPrice: { type: Number, required: true, default: 0 },
  image: { type: String, default: '' },
  notes: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Product = mongoose.model('Product', productSchema);

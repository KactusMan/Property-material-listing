import mongoose from 'mongoose';

const priceChangeSchema = new mongoose.Schema({
  price: Number,
  supplierLink: String,
  source: String,
  changedBy: String,
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  unit: { type: String, default: 'each' },
  details: { type: String, default: '' },
  supplierLink: { type: String, default: '' },
  store: { type: String, default: '' },
  expectedPrice: { type: Number, required: true, default: 0 },
  image: { type: String, default: '' },
  notes: { type: String, default: '' },
  source: { type: String, default: 'workbook' },
  priceHistory: { type: [priceChangeSchema], default: [] },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Product = mongoose.model('Product', productSchema);

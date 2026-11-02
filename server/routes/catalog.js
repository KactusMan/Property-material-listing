import { Router } from 'express';
import { Product } from '../models/Product.js';
import { asyncHandler, bool, HttpError, link, nextId, num, str } from '../lib/http.js';
import { adminOnly } from '../lib/security.js';
import { storeFromUrl } from '../lib/stores.js';
import { publicProduct } from './shared.js';

const router = Router();

const readProduct = (body) => {
  const supplierLink = link(body.supplierLink, 'Product link');
  return {
    name: str(body.name, 'Name', { max: 160, required: true }),
    category: str(body.category, 'Category', { max: 60, required: true }),
    unit: str(body.unit, 'Unit', { max: 30 }) || 'each',
    details: str(body.details, 'Details', { max: 300 }),
    supplierLink,
    store: str(body.store, 'Store', { max: 40 }) || storeFromUrl(supplierLink),
    expectedPrice: num(body.expectedPrice, 'Price', { max: 1_000_000 }),
    image: link(body.image, 'Image link'),
    notes: str(body.notes, 'Notes', { max: 500 })
  };
};

router.get('/', asyncHandler(async (req, res) => {
  const admin = req.user.role === 'admin';
  const products = await Product.find(admin ? {} : { active: true }).sort({ category: 1, name: 1 }).lean();
  res.json(products.map((p) => publicProduct(p, { admin })));
}));

router.post('/', adminOnly, asyncHandler(async (req, res) => {
  const fields = readProduct(req.body);
  const productId = await nextId(Product, 'productId', 'P');
  const product = await Product.create({
    ...fields,
    productId,
    source: req.body.source === 'assistant' ? 'assistant' : 'admin',
    priceHistory: [{ price: fields.expectedPrice, supplierLink: fields.supplierLink, source: 'created', changedBy: req.user.email }]
  });
  res.status(201).json(publicProduct(product.toObject(), { admin: true }));
}));

router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const fields = readProduct(req.body);
  const product = await Product.findOne({ productId: str(req.params.id, 'Product') });
  if (!product) throw new HttpError(404, 'Product not found.');
  if (product.expectedPrice !== fields.expectedPrice || product.supplierLink !== fields.supplierLink) {
    product.priceHistory.push({ price: fields.expectedPrice, supplierLink: fields.supplierLink, source: 'admin edit', changedBy: req.user.email });
  }
  Object.assign(product, fields);
  if (req.body.active !== undefined) product.active = bool(req.body.active);
  await product.save();
  res.json(publicProduct(product.toObject(), { admin: true }));
}));

// Price-only update, used when the admin accepts a price the assistant found.
router.patch('/:id/price', adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findOne({ productId: str(req.params.id, 'Product') });
  if (!product) throw new HttpError(404, 'Product not found.');
  const supplierLink = link(req.body.supplierLink, 'Product link') || product.supplierLink;
  product.expectedPrice = num(req.body.expectedPrice, 'Price', { min: 0.01, max: 1_000_000, required: true });
  product.supplierLink = supplierLink;
  product.store = storeFromUrl(supplierLink) || product.store;
  product.priceHistory.push({ price: product.expectedPrice, supplierLink, source: 'assistant', changedBy: req.user.email });
  await product.save();
  res.json(publicProduct(product.toObject(), { admin: true }));
}));

router.patch('/:id/active', adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { productId: str(req.params.id, 'Product') },
    { $set: { active: bool(req.body.active) } },
    { new: true }
  ).lean();
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json(publicProduct(product, { admin: true }));
}));

export default router;

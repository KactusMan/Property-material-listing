import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Suggestion } from '../models/Suggestion.js';
import { asyncHandler, bad, HttpError, link, nextId, num, oneOf, str } from '../lib/http.js';
import { notifySuggestion } from '../lib/notify.js';
import { adminOnly, approvedOnly, rateLimit } from '../lib/security.js';
import { storeFromUrl } from '../lib/stores.js';
import { vendorForUser } from './shared.js';

const router = Router();

const view = ({ _id, __v, ...s }) => s;
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 40, key: (req) => String(req.user._id), message: 'You have sent a lot of suggestions this hour. Try again later.' });

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { 'submittedBy.userId': String(req.user._id) };
  const suggestions = await Suggestion.find(filter).sort({ createdAt: -1 }).limit(300).lean();
  res.json(suggestions.map(view));
}));

// Vendors (and admins, for record keeping) propose a new material or a better price.
router.post('/', approvedOnly, submitLimiter, asyncHandler(async (req, res) => {
  const kind = oneOf(req.body.kind, 'Suggestion type', ['new', 'price']);
  const supplierLink = link(req.body.supplierLink, 'Product link');
  if (!supplierLink) throw bad('Add the link where you found it so it can be checked.');
  const price = num(req.body.price, 'Price', { min: 0.01, max: 1_000_000, required: true });

  let product = null;
  if (kind === 'price') {
    product = await Product.findOne({ productId: str(req.body.productId, 'Material', { max: 20, required: true }), active: true }).lean();
    if (!product) throw bad('Pick the catalogue material this price is for.');
  }

  const vendor = await vendorForUser(req.user);
  const suggestion = await Suggestion.create({
    suggestionId: await nextId(Suggestion, 'suggestionId', 'S', 4),
    kind,
    productId: product?.productId || '',
    currentPrice: product ? product.expectedPrice : null,
    name: product ? product.name : str(req.body.name, 'Material name', { max: 160, required: true }),
    category: product ? product.category : str(req.body.category, 'Category', { max: 60 }) || 'General',
    unit: product ? product.unit : str(req.body.unit, 'Unit', { max: 30 }) || 'each',
    details: str(req.body.details, 'Details', { max: 300 }),
    supplierLink,
    store: storeFromUrl(supplierLink),
    price,
    notes: str(req.body.notes, 'Notes', { max: 600 }),
    submittedBy: {
      userId: String(req.user._id),
      name: vendor?.name || req.user.companyName || req.user.name,
      email: req.user.email,
      contractorId: req.user.contractorId || ''
    }
  });
  if (req.user.role !== 'admin') await notifySuggestion(suggestion);
  res.status(201).json(view(suggestion.toObject()));
}));

router.post('/:id/review', adminOnly, asyncHandler(async (req, res) => {
  const action = oneOf(req.body.action, 'Action', ['approve', 'reject']);
  const suggestion = await Suggestion.findOne({ suggestionId: str(req.params.id, 'Suggestion', { max: 20 }) });
  if (!suggestion) throw new HttpError(404, 'Suggestion not found.');
  if (suggestion.status !== 'Pending') throw bad('This suggestion has already been reviewed.');

  const note = str(req.body.note, 'Note', { max: 500 });
  if (action === 'approve') {
    // The admin may correct the price, name or category before it goes live.
    const price = req.body.price !== undefined ? num(req.body.price, 'Price', { min: 0, max: 1_000_000 }) : suggestion.price;
    const history = { price, supplierLink: suggestion.supplierLink, source: `suggestion ${suggestion.suggestionId}`, changedBy: req.user.email };
    if (suggestion.kind === 'price') {
      const product = await Product.findOne({ productId: suggestion.productId });
      if (!product) throw bad('The catalogue material for this suggestion no longer exists.');
      product.expectedPrice = price;
      product.supplierLink = suggestion.supplierLink;
      product.store = suggestion.store;
      product.priceHistory.push(history);
      await product.save();
      suggestion.resultProductId = product.productId;
    } else {
      const product = await Product.create({
        productId: await nextId(Product, 'productId', 'P'),
        name: str(req.body.name, 'Material name', { max: 160 }) || suggestion.name,
        category: str(req.body.category, 'Category', { max: 60 }) || suggestion.category,
        unit: suggestion.unit,
        details: suggestion.details,
        supplierLink: suggestion.supplierLink,
        store: suggestion.store,
        expectedPrice: price,
        notes: `Suggested by ${suggestion.submittedBy?.name || 'a vendor'}`,
        source: 'vendor',
        priceHistory: [history],
        active: true
      });
      suggestion.resultProductId = product.productId;
    }
    suggestion.price = price;
  }

  suggestion.status = action === 'approve' ? 'Approved' : 'Rejected';
  suggestion.reviewNote = note;
  suggestion.reviewedBy = req.user.email;
  suggestion.reviewedAt = new Date();
  await suggestion.save();
  res.json(view(suggestion.toObject()));
}));

export default router;

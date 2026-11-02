import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Request } from '../models/Request.js';
import { asyncHandler, bad, HttpError, num, oneOf, str } from '../lib/http.js';
import { adminOnly, approvedOnly } from '../lib/security.js';
import { assignedPropertiesFor, vendorForUser } from './shared.js';

const router = Router();
const STATUSES = ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Rejected'];

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { contractorEmail: req.user.email };
  const requests = await Request.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.json(requests.map(({ _id, __v, ...r }) => r));
}));

router.post('/', approvedOnly, asyncHandler(async (req, res) => {
  if (req.user.role !== 'contractor') throw new HttpError(403, 'Only vendors submit material requests.');

  const propertyId = str(req.body.propertyId, 'Property', { max: 20, required: true });
  const property = (await assignedPropertiesFor(req.user)).find((p) => p.propertyId === propertyId);
  if (!property) throw new HttpError(403, 'You can only order for properties assigned to you.');

  if (!Array.isArray(req.body.items) || req.body.items.length === 0) throw bad('Add at least one material.');
  if (req.body.items.length > 100) throw bad('A request can contain at most 100 materials.');

  const wanted = new Map();
  for (const item of req.body.items) {
    const id = str(item?.productId, 'Material', { max: 20, required: true });
    const quantity = num(item?.quantity, 'Quantity', { min: 0.01, max: 100000, required: true });
    wanted.set(id, (wanted.get(id) || 0) + quantity);
  }

  const products = await Product.find({ productId: { $in: [...wanted.keys()] }, active: true }).lean();
  if (products.length !== wanted.size) throw bad('One of the selected materials is no longer available. Refresh and try again.');

  const items = products.map((p) => {
    const quantity = wanted.get(p.productId);
    return {
      productId: p.productId,
      productName: p.name,
      category: p.category,
      details: p.details,
      supplierLink: p.supplierLink,
      unit: p.unit,
      quantity,
      expectedPrice: p.expectedPrice,
      estimatedTotal: Math.round(quantity * p.expectedPrice * 100) / 100
    };
  });

  const vendor = await vendorForUser(req.user);
  const request = await Request.create({
    requestId: `REQ-${Date.now().toString(36).toUpperCase()}`,
    contractorId: vendor?.contractorId || '',
    contractorName: vendor?.name || req.user.companyName || req.user.name,
    contractorEmail: req.user.email,
    propertyId: property.propertyId,
    propertyName: property.name,
    propertyAddress: property.address,
    notes: str(req.body.notes, 'Notes', { max: 1000 }),
    estimatedTotal: Math.round(items.reduce((sum, i) => sum + i.estimatedTotal, 0) * 100) / 100,
    status: 'Submitted',
    history: [{ status: 'Submitted', by: req.user.email }],
    items
  });

  const { _id, __v, ...saved } = request.toObject();
  res.status(201).json(saved);
}));

router.patch('/:requestId/status', adminOnly, asyncHandler(async (req, res) => {
  const status = oneOf(req.body.status, 'Status', STATUSES);
  const request = await Request.findOneAndUpdate(
    { requestId: str(req.params.requestId, 'Request', { max: 40 }) },
    { $set: { status }, $push: { history: { status, by: req.user.email, at: new Date() } } },
    { new: true }
  ).lean();
  if (!request) throw new HttpError(404, 'Request not found.');
  const { _id, __v, ...saved } = request;
  res.json(saved);
}));

export default router;

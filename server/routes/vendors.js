import { Router } from 'express';
import mongoose from 'mongoose';
import { Contractor } from '../models/Contractor.js';
import { Property } from '../models/Property.js';
import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { asyncHandler, bad, bool, email, HttpError, idList, nextId, password, str } from '../lib/http.js';
import { resolvePropertyIds } from './shared.js';

// Every route in this file is mounted behind adminOnly.
const router = Router();

const statusOf = (vendor, account) => {
  if (!vendor.active) return 'disabled';
  if (!account || !account.active) return 'no-login';
  if (!account.lastLoginAt) return 'invited';
  return 'active';
};

const vendorView = (vendor, account, properties, requestCount = 0) => ({
  id: vendor.contractorId,
  contractorId: vendor.contractorId,
  name: vendor.name,
  email: vendor.email || '',
  phone: vendor.phone || '',
  companyName: vendor.companyName || '',
  trade: vendor.trade || '',
  notes: vendor.notes || '',
  active: vendor.active,
  assignedProperties: resolvePropertyIds(vendor.assignedProperties, properties),
  account: account
    ? { email: account.email, name: account.name, lastLoginAt: account.lastLoginAt, active: account.active, approved: account.approved }
    : null,
  status: statusOf(vendor, account),
  requestCount
});

const loadVendor = async (id) => {
  const vendor = await Contractor.findOne({ contractorId: str(id, 'Vendor', { max: 20 }) });
  if (!vendor) throw new HttpError(404, 'Vendor not found.');
  return vendor;
};

const respondWithVendor = async (res, vendor) => {
  const [account, properties, requestCount] = await Promise.all([
    User.findOne({ contractorId: vendor.contractorId, role: 'contractor' }).sort({ lastLoginAt: -1 }).lean(),
    Property.find({}).lean(),
    Request.countDocuments({ contractorId: vendor.contractorId })
  ]);
  res.json(vendorView(vendor.toObject ? vendor.toObject() : vendor, account, properties, requestCount));
};

router.get('/', asyncHandler(async (req, res) => {
  const [vendors, accounts, properties, counts] = await Promise.all([
    Contractor.find({}).sort({ name: 1 }).lean(),
    User.find({ role: 'contractor', contractorId: { $nin: ['', null] } }).select('-password').lean(),
    Property.find({}).lean(),
    Request.aggregate([{ $group: { _id: '$contractorId', n: { $sum: 1 } } }])
  ]);
  const accountByVendor = new Map();
  for (const account of accounts) {
    const current = accountByVendor.get(account.contractorId);
    if (!current || (account.lastLoginAt || 0) > (current.lastLoginAt || 0)) accountByVendor.set(account.contractorId, account);
  }
  const countByVendor = new Map(counts.map((c) => [c._id, c.n]));
  res.json(vendors.map((v) => vendorView(v, accountByVendor.get(v.contractorId), properties, countByVendor.get(v.contractorId) || 0)));
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'Vendor name', { max: 160, required: true });
  const contractorId = await nextId(Contractor, 'contractorId', 'C');
  const vendor = await Contractor.create({
    contractorId,
    name,
    companyName: str(req.body.companyName, 'Company', { max: 160 }) || name,
    phone: str(req.body.phone, 'Phone', { max: 40 }),
    trade: str(req.body.trade, 'Trade', { max: 80 }),
    notes: str(req.body.notes, 'Notes', { max: 500 }),
    active: true
  });
  res.status(201);
  await respondWithVendor(res, vendor);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const vendor = await loadVendor(req.params.id);
  vendor.name = str(req.body.name, 'Vendor name', { max: 160, required: true });
  vendor.companyName = str(req.body.companyName, 'Company', { max: 160 });
  vendor.phone = str(req.body.phone, 'Phone', { max: 40 });
  vendor.trade = str(req.body.trade, 'Trade', { max: 80 });
  vendor.notes = str(req.body.notes, 'Notes', { max: 500 });
  if (req.body.active !== undefined) vendor.active = bool(req.body.active);
  await vendor.save();
  await respondWithVendor(res, vendor);
}));

router.put('/:id/properties', asyncHandler(async (req, res) => {
  const vendor = await loadVendor(req.params.id);
  const wanted = idList(req.body.assignedProperties, 'Assigned properties', /^PR\d{1,5}$/);
  const existing = new Set((await Property.find({ propertyId: { $in: wanted } }, { propertyId: 1 }).lean()).map((p) => p.propertyId));
  vendor.assignedProperties = wanted.filter((id) => existing.has(id));
  await vendor.save();
  await respondWithVendor(res, vendor);
}));

// Create (or reset) the login for a vendor from the list, so the admin can onboard vendors directly.
router.post('/:id/account', asyncHandler(async (req, res) => {
  const vendor = await loadVendor(req.params.id);
  const address = email(req.body.email);
  const secret = password(req.body.password);
  let user = await User.findOne({ email: address });
  if (user && user.role === 'admin') throw bad('That email belongs to an administrator.');
  if (user && user.contractorId && user.contractorId !== vendor.contractorId) {
    throw bad('That email is already linked to a different vendor.');
  }
  if (!user) user = new User({ email: address, name: vendor.name, role: 'contractor' });
  user.password = secret;
  user.contractorId = vendor.contractorId;
  user.companyName = vendor.companyName || vendor.name;
  user.approved = true;
  user.active = true;
  await user.save();
  vendor.email = address;
  await vendor.save();
  await respondWithVendor(res, vendor);
}));

router.get('/signups', asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'contractor', approved: { $ne: true }, active: true }).select('-password').sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, companyName: u.companyName, createdAt: u.createdAt })));
}));

const loadSignup = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Sign-up not found.');
  const user = await User.findOne({ _id: id, role: 'contractor' });
  if (!user) throw new HttpError(404, 'Sign-up not found.');
  return user;
};

// Approve a self-registered account, linking it to an existing vendor or creating a new vendor.
router.post('/signups/:userId/approve', asyncHandler(async (req, res) => {
  const user = await loadSignup(req.params.userId);
  const target = str(req.body.contractorId, 'Vendor', { max: 20 });
  let vendor;
  if (target && target !== 'new') {
    vendor = await loadVendor(target);
  } else {
    vendor = await Contractor.create({
      contractorId: await nextId(Contractor, 'contractorId', 'C'),
      name: user.companyName || user.name,
      companyName: user.companyName || user.name,
      email: user.email,
      active: true
    });
  }
  if (!vendor.email) {
    vendor.email = user.email;
    await vendor.save();
  }
  user.contractorId = vendor.contractorId;
  user.approved = true;
  await user.save();
  await respondWithVendor(res, vendor);
}));

router.post('/signups/:userId/reject', asyncHandler(async (req, res) => {
  const user = await loadSignup(req.params.userId);
  user.active = false;
  await user.save();
  res.json({ ok: true });
}));

export default router;

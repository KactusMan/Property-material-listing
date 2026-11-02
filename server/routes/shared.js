import { Contractor } from '../models/Contractor.js';
import { Property } from '../models/Property.js';

export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  companyName: u.companyName || '',
  contractorId: u.contractorId || '',
  approved: u.role === 'admin' ? true : Boolean(u.approved),
  lastLoginAt: u.lastLoginAt || null
});

export const publicProduct = (p, { admin = false } = {}) => ({
  id: p.productId,
  productId: p.productId,
  name: p.name,
  category: p.category,
  unit: p.unit,
  details: p.details,
  supplierLink: p.supplierLink,
  store: p.store || '',
  expectedPrice: p.expectedPrice,
  image: p.image,
  notes: p.notes,
  active: p.active,
  updatedAt: p.updatedAt,
  ...(admin ? { source: p.source || '', priceHistory: (p.priceHistory || []).slice(-5) } : {})
});

export const publicProperty = (p) => ({
  id: p.propertyId,
  propertyId: p.propertyId,
  name: p.name,
  address: p.address,
  active: p.active
});

// Older records stored property names instead of IDs; accept both.
export const resolvePropertyIds = (assigned = [], properties) => {
  const byName = new Map(properties.map((p) => [p.name.toLowerCase(), p.propertyId]));
  const ids = new Set(properties.map((p) => p.propertyId));
  return [...new Set((assigned || []).map((a) => (ids.has(a) ? a : byName.get(String(a).toLowerCase()))).filter(Boolean))];
};

export const vendorForUser = async (user) => {
  if (!user?.contractorId) return null;
  return Contractor.findOne({ contractorId: user.contractorId }).lean();
};

export const assignedPropertiesFor = async (user) => {
  if (!user?.approved) return [];
  const vendor = await vendorForUser(user);
  if (!vendor || !vendor.active) return [];
  const properties = await Property.find({ active: true }).lean();
  const ids = new Set(resolvePropertyIds(vendor.assignedProperties, properties));
  return properties.filter((p) => ids.has(p.propertyId));
};

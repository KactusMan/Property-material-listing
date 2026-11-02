import { Router } from 'express';
import { Property } from '../models/Property.js';
import { Contractor } from '../models/Contractor.js';
import { asyncHandler, bool, HttpError, nextId, str } from '../lib/http.js';
import { adminOnly } from '../lib/security.js';
import { assignedPropertiesFor, publicProperty, resolvePropertyIds } from './shared.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const mine = await assignedPropertiesFor(req.user);
    return res.json(mine.map(publicProperty));
  }
  const [properties, vendors] = await Promise.all([
    Property.find({}).sort({ name: 1 }).lean(),
    Contractor.find({}, { contractorId: 1, name: 1, assignedProperties: 1 }).lean()
  ]);
  res.json(properties.map((p) => ({
    ...publicProperty(p),
    vendors: vendors
      .filter((v) => resolvePropertyIds(v.assignedProperties, properties).includes(p.propertyId))
      .map((v) => ({ id: v.contractorId, name: v.name }))
  })));
}));

router.post('/', adminOnly, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'Property name', { max: 160, required: true });
  const address = str(req.body.address, 'Address', { max: 240 }) || name;
  if (await Property.exists({ name })) throw new HttpError(400, 'A property with this name already exists.');
  const propertyId = await nextId(Property, 'propertyId', 'PR');
  const property = await Property.create({ propertyId, name, address, active: true });
  res.status(201).json({ ...publicProperty(property), vendors: [] });
}));

router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'Property name', { max: 160, required: true });
  const update = {
    name,
    address: str(req.body.address, 'Address', { max: 240 }) || name,
    active: req.body.active === undefined ? true : bool(req.body.active)
  };
  const property = await Property.findOneAndUpdate({ propertyId: str(req.params.id, 'Property') }, { $set: update }, { new: true }).lean();
  if (!property) throw new HttpError(404, 'Property not found.');
  res.json(publicProperty(property));
}));

export default router;

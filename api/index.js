import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from '../server/config/db.js';
import { Product } from '../server/models/Product.js';
import { Property } from '../server/models/Property.js';
import { Contractor } from '../server/models/Contractor.js';
import { Request } from '../server/models/Request.js';
import { User } from '../server/models/User.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'propertymaterials_secret_key_2026';

app.use(cors());
app.use(express.json());

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database Connection Error: ' + err.message });
  }
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, companyName: user.companyName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Your account is not active.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
};

/* AUTH ENDPOINTS */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 10) {
      return res.status(400).json({ error: 'Use a password with at least 10 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'contractor',
      companyName: companyName || name,
      contractorId: ''
    });

    const token = generateToken(newUser);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyName: newUser.companyName,
        contractorId: newUser.contractorId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        contractorId: user.contractorId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

/* CORE DATA ENDPOINTS */
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ active: true }).lean();
    const isAdmin = req.user.role === 'admin';
    const safeProducts = products.map(p => ({
      id: p.productId,
      name: p.name,
      category: p.category,
      unit: p.unit,
      details: p.details,
      supplierLink: p.supplierLink,
      image: p.image,
      notes: p.notes,
      ...(isAdmin ? { expectedPrice: p.expectedPrice } : {})
    }));
    res.json(safeProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products: ' + error.message });
  }
});

app.get('/api/properties', authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ active: true }).lean();
    res.json(properties.map(p => ({ id: p.propertyId, name: p.name, address: p.address })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties: ' + error.message });
  }
});

app.get('/api/contractors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const contractors = await Contractor.find({ active: true }).lean();
    res.json(contractors.map(c => ({ id: c.contractorId, name: c.name })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors: ' + error.message });
  }
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'contractor') {
      filter = {
        contractorEmail: req.user.email
      };
    }

    const requests = await Request.find(filter).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
  }
});

app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { property, notes, items } = req.body;
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can submit material requests.' });
    }
    if (!property) {
      return res.status(400).json({ error: 'A property is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one item.' });
    }

    const propDoc = await Property.findOne({ $or: [{ name: property }, { propertyId: property }] }).lean();
    const contDoc = req.user.contractorId
      ? await Contractor.findOne({ contractorId: req.user.contractorId }).lean()
      : null;

    const productIds = items.map(i => i.id);
    const dbProducts = await Product.find({ productId: { $in: productIds } }).lean();

    const productMap = {};
    dbProducts.forEach(p => { productMap[p.productId] = p; });

    let overallTotal = 0;
    const savedItems = [];

    for (const item of items) {
      const dbProd = productMap[item.id];
      if (!dbProd) continue;
      const qty = Number(item.quantity);
      if (qty <= 0) continue;

      const price = Number(dbProd.expectedPrice || 0);
      const lineTotal = qty * price;
      overallTotal += lineTotal;

      savedItems.push({
        productId: dbProd.productId,
        productName: dbProd.name,
        quantity: qty,
        expectedPrice: price,
        estimatedTotal: lineTotal
      });
    }

    const requestId = 'REQ-' + Date.now();
    const newRequest = await Request.create({
      requestId,
      contractorId: contDoc ? contDoc.contractorId : '',
      contractorName: contDoc ? contDoc.name : (req.user.companyName || req.user.name),
      contractorEmail: req.user.email,
      propertyId: propDoc ? propDoc.propertyId : '',
      propertyName: propDoc ? propDoc.name : property,
      propertyAddress: propDoc ? propDoc.address : '',
      notes: notes || '',
      estimatedTotal: overallTotal,
      status: 'Submitted',
      items: savedItems
    });

    res.status(201).json({ success: true, requestId: newRequest.requestId, estimatedTotal: newRequest.estimatedTotal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit request: ' + error.message });
  }
});

app.patch('/api/requests/:requestId/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid request status.' });
    }

    const updated = await Request.findOneAndUpdate(
      { requestId },
      { $set: { status } },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status: ' + error.message });
  }
});

export default app;

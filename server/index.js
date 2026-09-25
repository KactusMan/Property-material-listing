import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Property } from './models/Property.js';
import { Contractor } from './models/Contractor.js';
import { Request } from './models/Request.js';
import { User } from './models/User.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'propertymaterials_secret_key_2026';

app.use(cors());
app.use(express.json());

// The API starts only after MongoDB is available
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup blocked: ${error.message}`);
    process.exit(1);
  }
};

/* Helper to generate JWT Token */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, companyName: user.companyName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/* Middleware to authenticate token */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Your account is not active.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
};

/* =========================================================
   AUTHENTICATION API ENDPOINTS
   ========================================================= */

// Register User (Contractor)
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// Login User
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
        contractorId: user.contractorId,
        assignedProperties: user.assignedProperties || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Get Current Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile: ' + error.message });
  }
});

/* =========================================================
   CORE PROPERTY & MATERIAL ENDPOINTS
   ========================================================= */

// Get Products
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { active: true };
    const products = await Product.find(filter).sort({ category: 1, name: 1 }).lean();

    const safeProducts = products.map(p => ({
      id: p.productId,
      productId: p.productId,
      name: p.name,
      category: p.category,
      unit: p.unit,
      details: p.details,
      supplierLink: p.supplierLink,
      image: p.image,
      notes: p.notes,
      active: p.active,
      expectedPrice: p.expectedPrice
    }));

    res.json(safeProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products: ' + error.message });
  }
});

// Admin: Create Product
app.post('/api/products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, category, unit, details, supplierLink, expectedPrice, image, notes } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required.' });
    }

    const count = await Product.countDocuments();
    const productId = `P${String(count + 1).padStart(3, '0')}`;

    const newProd = await Product.create({
      productId,
      name,
      category,
      unit: unit || 'each',
      details: details || '',
      supplierLink: supplierLink || '',
      expectedPrice: Number(expectedPrice || 0),
      image: image || '',
      notes: notes || '',
      active: true
    });

    res.status(201).json(newProd);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product: ' + error.message });
  }
});

// Admin: Edit Product
app.put('/api/products/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, details, supplierLink, expectedPrice, image, notes, active } = req.body;

    const updated = await Product.findOneAndUpdate(
      { productId: id },
      { $set: { name, category, unit, details, supplierLink, expectedPrice: Number(expectedPrice || 0), image, notes, active } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product: ' + error.message });
  }
});

// Admin: Toggle Product Active State
app.patch('/api/products/:id/toggle', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await Product.findOne({ productId: id });
    if (!prod) return res.status(404).json({ error: 'Product not found.' });

    prod.active = !prod.active;
    await prod.save();
    res.json(prod);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle product status: ' + error.message });
  }
});

// Get Properties
app.get('/api/properties', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { active: true };
    const properties = await Property.find(filter).sort({ name: 1 }).lean();

    const safeProperties = properties.map(p => ({
      id: p.propertyId,
      propertyId: p.propertyId,
      name: p.name,
      address: p.address,
      active: p.active
    }));

    res.json(safeProperties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties: ' + error.message });
  }
});

// Admin: Create Property
app.post('/api/properties', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Property name and address are required.' });
    }

    const count = await Property.countDocuments();
    const propertyId = `PR${String(count + 1).padStart(3, '0')}`;

    const newProp = await Property.create({
      propertyId,
      name,
      address,
      active: true
    });

    res.status(201).json(newProp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property: ' + error.message });
  }
});

// Admin: Edit Property
app.put('/api/properties/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, active } = req.body;

    const updated = await Property.findOneAndUpdate(
      { propertyId: id },
      { $set: { name, address, active } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Property not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property: ' + error.message });
  }
});

// Get Active Contractors
app.get('/api/contractors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const contractors = await Contractor.find({}).sort({ name: 1 }).lean();
    const safeContractors = contractors.map(c => ({
      id: c.contractorId,
      contractorId: c.contractorId,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      companyName: c.companyName || '',
      assignedProperties: c.assignedProperties || [],
      active: c.active
    }));
    res.json(safeContractors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors: ' + error.message });
  }
});

// Admin: Update Contractor Assigned Properties
app.put('/api/contractors/:id/properties', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedProperties } = req.body;

    const updated = await Contractor.findOneAndUpdate(
      { contractorId: id },
      { $set: { assignedProperties } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Contractor not found.' });

    if (updated.email) {
      await User.updateOne({ email: updated.email.toLowerCase() }, { $set: { assignedProperties } });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assigned properties: ' + error.message });
  }
});

// Get Requests
app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'contractor') {
      filter = { contractorEmail: req.user.email };
    }

    const requests = await Request.find(filter).sort({ createdAt: -1 }).lean();

    const allProducts = await Product.find({}).lean();
    const prodMap = {};
    allProducts.forEach(p => { prodMap[p.productId] = p; });

    const enrichedRequests = requests.map(r => ({
      ...r,
      items: (r.items || []).map(item => {
        const pDoc = prodMap[item.productId];
        return {
          ...item,
          category: item.category || (pDoc ? pDoc.category : ''),
          details: item.details || (pDoc ? pDoc.details : ''),
          supplierLink: item.supplierLink || (pDoc ? pDoc.supplierLink : '')
        };
      })
    }));

    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
  }
});

// Save Material Request
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
      return res.status(400).json({ error: 'Please select at least one material item with quantity.' });
    }

    const propDoc = await Property.findOne({ 
      $or: [{ name: property }, { propertyId: property }] 
    }).lean();
    const propertyName = propDoc ? propDoc.name : property;
    const propertyAddress = propDoc ? propDoc.address : '';

    const contDoc = req.user.contractorId
      ? await Contractor.findOne({ contractorId: req.user.contractorId }).lean()
      : null;
    const contractorName = contDoc ? contDoc.name : (req.user.companyName || req.user.name);

    const productIds = items.map(i => i.id);
    const dbProducts = await Product.find({ productId: { $in: productIds } }).lean();

    const productMap = {};
    dbProducts.forEach(p => {
      productMap[p.productId] = p;
    });

    let overallTotal = 0;
    const savedItems = [];

    for (const item of items) {
      const dbProd = productMap[item.id];
      if (!dbProd) {
        return res.status(400).json({ error: `Product ID not found: ${item.id}` });
      }

      const qty = Number(item.quantity);
      if (qty <= 0) continue;

      const price = Number(dbProd.expectedPrice || 0);
      const lineTotal = qty * price;
      overallTotal += lineTotal;

      savedItems.push({
        productId: dbProd.productId,
        productName: dbProd.name,
        category: dbProd.category || '',
        details: dbProd.details || '',
        supplierLink: dbProd.supplierLink || '',
        quantity: qty,
        expectedPrice: price,
        estimatedTotal: lineTotal
      });
    }

    if (savedItems.length === 0) {
      return res.status(400).json({ error: 'No valid item quantities found.' });
    }

    const requestId = 'REQ-' + Date.now();

    const newRequest = await Request.create({
      requestId,
      contractorId: contDoc ? contDoc.contractorId : '',
      contractorName,
      contractorEmail: req.user.email,
      propertyId: propDoc ? propDoc.propertyId : '',
      propertyName,
      propertyAddress,
      notes: notes || '',
      estimatedTotal: overallTotal,
      status: 'Submitted',
      items: savedItems
    });

    res.status(201).json({
      success: true,
      requestId: newRequest.requestId,
      estimatedTotal: newRequest.estimatedTotal,
      message: 'Request saved to MongoDB successfully!'
    });

  } catch (error) {
    console.error('Error saving request:', error);
    res.status(500).json({ error: 'Failed to submit request: ' + error.message });
  }
});

// Update Request Status (Admin action)
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

    if (!updated) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status: ' + error.message });
  }
});

startServer();

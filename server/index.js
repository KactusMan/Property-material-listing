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
import { seedDatabase } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'propertymaterials_secret_key_2026';

app.use(cors());
app.use(express.json());

// Initialize DB
connectDB().then(async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('No users found. Running database seeder...');
    await seedDatabase();
  }
});

/* Helper to generate JWT Token */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, companyName: user.companyName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/* Middleware to authenticate token */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/* =========================================================
   AUTHENTICATION API ENDPOINTS (with bcrypt hashing)
   ========================================================= */

// 1. Register User (Contractor)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName, contractorId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Password hashed automatically via pre-save hook in User model
      role: role === 'admin' ? 'admin' : 'contractor',
      companyName: companyName || name,
      contractorId: contractorId || ''
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

// 2. Login User (with bcrypt match Password)
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// 3. Get Current Profile
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

// Get Active Products (Prices hidden for Vendor security, unless Admin)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).lean();
    
    // Security: hide expectedPrice if not admin
    const isAdmin = req.headers['x-user-role'] === 'admin';

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

// Get Active Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find({ active: true }).lean();
    const safeProperties = properties.map(p => ({
      id: p.propertyId,
      name: p.name,
      address: p.address
    }));
    res.json(safeProperties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties: ' + error.message });
  }
});

// Get Active Contractors
app.get('/api/contractors', async (req, res) => {
  try {
    const contractors = await Contractor.find({ active: true }).lean();
    const safeContractors = contractors.map(c => ({
      id: c.contractorId,
      name: c.name
    }));
    res.json(safeContractors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors: ' + error.message });
  }
});

// Get Requests (Filtered by role: Contractor sees their own; Admin sees all)
app.get('/api/requests', async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    const email = req.headers['x-user-email'];
    const company = req.headers['x-user-company'];

    let filter = {};
    if (role === 'contractor') {
      filter = {
        $or: [
          { contractorEmail: email },
          { contractorName: company }
        ]
      };
    }

    const requests = await Request.find(filter).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
  }
});

// Save Material Request
app.post('/api/requests', async (req, res) => {
  try {
    const { contractor, property, notes, items, contractorEmail } = req.body;

    if (!contractor || !property) {
      return res.status(400).json({ error: 'Vendor and Property are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one material item with quantity.' });
    }

    const propDoc = await Property.findOne({ 
      $or: [{ name: property }, { propertyId: property }] 
    }).lean();
    const propertyName = propDoc ? propDoc.name : property;
    const propertyAddress = propDoc ? propDoc.address : '';

    const contDoc = await Contractor.findOne({ 
      $or: [{ name: contractor }, { contractorId: contractor }] 
    }).lean();
    const contractorName = contDoc ? contDoc.name : contractor;

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
      contractorEmail: contractorEmail || '',
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
app.patch('/api/requests/:requestId/status', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

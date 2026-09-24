import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../server/config/db.js';
import { Product } from '../server/models/Product.js';
import { Property } from '../server/models/Property.js';
import { Contractor } from '../server/models/Contractor.js';
import { Request } from '../server/models/Request.js';
import { seedDatabase } from '../server/seed.js';

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database Connection Error: ' + err.message });
  }
});

/* =========================================================
   PUBLIC / VENDOR API ENDPOINTS
   ========================================================= */

// 1. Get Active Products (Prices hidden for Vendor security)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).lean();
    const safeProducts = products.map(p => ({
      id: p.productId,
      name: p.name,
      category: p.category,
      unit: p.unit,
      details: p.details,
      supplierLink: p.supplierLink,
      image: p.image,
      notes: p.notes
    }));
    res.json(safeProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products: ' + error.message });
  }
});

// 2. Get Active Properties
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

// 3. Get Active Contractors
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

// 4. Save Request
app.post('/api/requests', async (req, res) => {
  try {
    const { contractor, property, notes, items } = req.body;

    if (!contractor || !property) {
      return res.status(400).json({ error: 'Vendor and Property are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one product with quantity.' });
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
    console.error('Error saving request to MongoDB:', error);
    res.status(500).json({ error: 'Failed to submit request: ' + error.message });
  }
});

/* =========================================================
   ADMIN API ENDPOINTS
   ========================================================= */

app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
  }
});

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
    res.status(500).json({ error: 'Failed to update request status: ' + error.message });
  }
});

app.get('/api/products/admin', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin products: ' + error.message });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database re-seeded successfully with 59 products & 19 properties!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database: ' + error.message });
  }
});

export default app;

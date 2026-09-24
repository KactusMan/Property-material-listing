import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Property } from './models/Property.js';
import { Contractor } from './models/Contractor.js';
import { Request } from './models/Request.js';
import { User } from './models/User.js';
import { loadExcelData } from './seedData.js';

export const seedDatabase = async () => {
  try {
    await connectDB();

    const excelData = loadExcelData();
    if (!excelData) {
      console.log('No Excel data loaded.');
      return;
    }

    const { products, properties, contractors } = excelData;

    console.log('Seeding products database...');
    for (const prod of products) {
      await Product.updateOne(
        { productId: prod.productId },
        { $set: prod },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${products.length} products into MongoDB.`);

    console.log('Seeding properties database...');
    for (const prop of properties) {
      await Property.updateOne(
        { propertyId: prop.propertyId },
        { $set: prop },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${properties.length} properties into MongoDB.`);

    console.log('Seeding contractors database...');
    for (const cont of contractors) {
      await Contractor.updateOne(
        { contractorId: cont.contractorId },
        { $set: cont },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${contractors.length} contractors into MongoDB.`);

    // Seed Default Users with bcrypt Password Hashing
    console.log('Seeding authentication users with password hashing...');

    // 1. Admin User
    const adminExists = await User.findOne({ email: 'admin@propertymaterials.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin Manager',
        email: 'admin@propertymaterials.com',
        password: 'admin123', // Will be hashed automatically by pre-save hook in User model!
        role: 'admin',
        companyName: 'EstateFlow Property Management'
      });
      console.log('✅ Created Admin user: admin@propertymaterials.com / admin123');
    }

    // 2. Contractor User 1 (Apex Builders)
    const contractor1Exists = await User.findOne({ email: 'contractor@apex.com' });
    if (!contractor1Exists) {
      await User.create({
        name: 'Apex Contractor',
        email: 'contractor@apex.com',
        password: 'contractor123',
        role: 'contractor',
        contractorId: 'C001',
        companyName: 'Apex Builders & Renovations'
      });
      console.log('✅ Created Contractor user: contractor@apex.com / contractor123');
    }

    // 3. Contractor User 2 (Premier Craft)
    const contractor2Exists = await User.findOne({ email: 'contractor@premier.com' });
    if (!contractor2Exists) {
      await User.create({
        name: 'Premier Craft',
        email: 'contractor@premier.com',
        password: 'contractor123',
        role: 'contractor',
        contractorId: 'C002',
        companyName: 'Premier Craft Contracting'
      });
      console.log('✅ Created Contractor user: contractor@premier.com / contractor123');
    }

    // Add initial sample requests if empty
    const reqCount = await Request.countDocuments();
    if (reqCount === 0) {
      await Request.create({
        requestId: 'REQ-1790270001',
        contractorId: 'C001',
        contractorName: 'Apex Builders & Renovations',
        contractorEmail: 'contractor@apex.com',
        propertyId: 'PR001',
        propertyName: '1006 Tunbridge Road',
        propertyAddress: '1006 Tunbridge Road',
        notes: 'Initial kitchen remodel flooring and recessed light fixtures',
        estimatedTotal: 845.00,
        status: 'Submitted',
        items: [
          {
            productId: 'P001',
            productName: 'LVP flooring',
            quantity: 200,
            expectedPrice: 3.29,
            estimatedTotal: 658.00
          },
          {
            productId: 'P032',
            productName: 'Recessed Ultra-Thin Canless LED Light 6in',
            quantity: 8,
            expectedPrice: 22.00,
            estimatedTotal: 176.00
          }
        ]
      });
      console.log('✅ Created sample request in MongoDB.');
    }

    console.log('🎉 Database seeding complete!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

// Execute if run directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}

import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Property } from './models/Property.js';
import { Contractor } from './models/Contractor.js';
import { Request } from './models/Request.js';
import { initialProducts, initialProperties, initialContractors } from './seedData.js';

export const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Seeding products database...');
    for (const prod of initialProducts) {
      await Product.updateOne(
        { productId: prod.productId },
        { $set: prod },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${initialProducts.length} products into MongoDB.`);

    console.log('Seeding properties database...');
    for (const prop of initialProperties) {
      await Property.updateOne(
        { propertyId: prop.propertyId },
        { $set: prop },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${initialProperties.length} properties into MongoDB.`);

    console.log('Seeding contractors database...');
    for (const cont of initialContractors) {
      await Contractor.updateOne(
        { contractorId: cont.contractorId },
        { $set: cont },
        { upsert: true }
      );
    }
    console.log(`✅ Loaded ${initialContractors.length} contractors into MongoDB.`);

    const requestCount = await Request.countDocuments();
    if (requestCount === 0) {
      console.log('Adding initial sample request into MongoDB...');
      await Request.create({
        requestId: 'REQ-1727200000100',
        contractorId: 'CON001',
        contractorName: 'Apex Builders & Renovations',
        propertyId: 'PR001',
        propertyName: 'PR001',
        propertyAddress: '1006 Tunbridge Road',
        notes: 'Initial framing phase recessed lights & outlet replacement',
        estimatedTotal: 310.00,
        status: 'Submitted',
        items: [
          {
            productId: 'P032',
            productName: 'Recessed Ultra-Thin Canless LED Light 6in',
            quantity: 10,
            expectedPrice: 22.00,
            estimatedTotal: 220.00
          },
          {
            productId: 'P029',
            productName: '120V Outlet / Switch Replacement',
            quantity: 5,
            expectedPrice: 18.00,
            estimatedTotal: 90.00
          }
        ]
      });
      console.log('✅ Created sample request in MongoDB.');
    }

    console.log('🎉 Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('Error seeding MongoDB:', error);
  }
};

// If run directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}

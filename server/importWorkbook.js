import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Property } from './models/Property.js';
import { Contractor } from './models/Contractor.js';
import { User } from './models/User.js';
import { loadExcelData } from './seedData.js';

const importWorkbook = async () => {
  await connectDB();
  const data = loadExcelData();
  if (!data) throw new Error('Could not load the property materials workbook.');

  const write = async (Model, records, key) => {
    for (const record of records) {
      await Model.updateOne({ [key]: record[key] }, { $set: record }, { upsert: true });
    }
  };

  await write(Product, data.products, 'productId');
  await write(Property, data.properties, 'propertyId');
  await write(Contractor, data.contractors, 'contractorId');

  const count = await User.countDocuments();
  if (count === 0) {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Property materials administrator' } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before the first import.');
    }
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'admin',
      companyName: ADMIN_NAME
    });
  }

  console.log(`Imported ${data.products.length} products, ${data.properties.length} properties, and ${data.contractors.length} contractors.`);
};

importWorkbook()
  .catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

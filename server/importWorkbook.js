// Brings MongoDB in line with the workbooks without overwriting anything edited in the app.
// Safe to rerun: existing records keep their current values; only missing records and links are added.
import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Property } from './models/Property.js';
import { Contractor } from './models/Contractor.js';
import { User } from './models/User.js';
import { nextId } from './lib/http.js';
import { resolvePropertyIds } from './routes/shared.js';
import { loadMaterialLinks, loadWorkbook } from './seedData.js';

const run = async () => {
  await connectDB();
  const data = loadWorkbook();
  const report = [];

  const insertMissing = async (Model, records, key) => {
    let added = 0;
    for (const record of records) {
      const result = await Model.updateOne({ [key]: record[key] }, { $setOnInsert: record }, { upsert: true });
      added += result.upsertedCount;
    }
    return added;
  };

  report.push(`products added: ${await insertMissing(Product, data.products, 'productId')}`);
  report.push(`properties added: ${await insertMissing(Property, data.properties, 'propertyId')}`);
  report.push(`vendors added: ${await insertMissing(Contractor, data.contractors, 'contractorId')}`);

  for (const extra of data.extraProperties) {
    if (!(await Property.exists({ name: extra.name }))) {
      await Property.create({ ...extra, propertyId: await nextId(Property, 'propertyId', 'PR'), active: true });
      report.push(`property added: ${extra.name}`);
    }
  }

  // Older builds stored assigned property names; convert them to property IDs.
  const properties = await Property.find({}).lean();
  for (const vendor of await Contractor.find({})) {
    const ids = resolvePropertyIds(vendor.assignedProperties, properties);
    if (JSON.stringify(ids) !== JSON.stringify(vendor.assignedProperties || [])) {
      vendor.assignedProperties = ids;
      await vendor.save();
    }
  }

  for (const a of data.assignments) {
    const result = await Contractor.updateOne({ contractorId: a.contractorId }, { $addToSet: { assignedProperties: a.propertyId } });
    if (result.modifiedCount) report.push(`assigned ${a.property} to ${a.vendor}`);
  }

  let linksAdded = 0;
  for (const item of loadMaterialLinks()) {
    if (await Product.exists({ source: 'links', name: item.name })) continue;
    await Product.create({
      ...item,
      productId: await nextId(Product, 'productId', 'P'),
      priceHistory: [{ price: 0, supplierLink: item.supplierLink, source: 'material list with links', changedBy: 'import' }]
    });
    linksAdded += 1;
  }
  report.push(`linked materials added: ${linksAdded}`);

  // Accounts created before approvals existed: linked vendors and admins are approved,
  // unlinked self-registrations go to the admin's sign-up queue.
  const approved = await User.updateMany(
    { approved: { $exists: false }, $or: [{ role: 'admin' }, { contractorId: { $nin: ['', null] } }] },
    { $set: { approved: true } }
  );
  const queued = await User.updateMany({ approved: { $exists: false } }, { $set: { approved: false } });
  report.push(`accounts approved: ${approved.modifiedCount}, queued for review: ${queued.modifiedCount}`);

  if ((await User.countDocuments({ role: 'admin' })) === 0) {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'MatFlow administrator' } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first administrator.');
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), password: ADMIN_PASSWORD, role: 'admin', approved: true });
    report.push('administrator created');
  }

  console.log(report.join('\n'));
};

run()
  .catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

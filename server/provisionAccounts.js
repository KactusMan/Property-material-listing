import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';

const required = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'TEST_CONTRACTOR_EMAIL', 'TEST_CONTRACTOR_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

const saveAccount = async ({ email, password, name, companyName, role }) => {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({ email: email.toLowerCase(), password, name, companyName, role });
  } else {
    user.name = name;
    user.companyName = companyName;
    user.role = role;
    user.active = true;
    user.password = password;
  }
  await user.save();
};

const provisionAccounts = async () => {
  await connectDB();
  await saveAccount({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || 'Property Materials Administrator',
    companyName: process.env.ADMIN_NAME || 'Property Materials Administrator',
    role: 'admin'
  });
  await saveAccount({
    email: process.env.TEST_CONTRACTOR_EMAIL,
    password: process.env.TEST_CONTRACTOR_PASSWORD,
    name: process.env.TEST_CONTRACTOR_NAME || 'Test Contractor',
    companyName: process.env.TEST_CONTRACTOR_COMPANY || 'Test Contractor Company',
    role: 'contractor'
  });
  console.log('Administrator and test contractor accounts are ready.');
};

provisionAccounts()
  .catch((error) => {
    console.error(`Account provisioning failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import { Request } from './models/Request.js';
import { Suggestion } from './models/Suggestion.js';
import { User } from './models/User.js';
import { asyncHandler, HttpError } from './lib/http.js';
import { adminOnly, authenticate, jwtConfigured, requireJson, securityHeaders } from './lib/security.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import propertyRoutes from './routes/properties.js';
import vendorRoutes from './routes/vendors.js';
import requestRoutes from './routes/requests.js';
import suggestionRoutes from './routes/suggestions.js';
import assistantRoutes from './routes/assistant.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(express.json({ limit: '200kb' }));
app.use(requireJson);

// Reports which settings are present (never their values) so a broken deploy is easy to diagnose.
app.get('/api/health', async (req, res) => {
  let database = false;
  try {
    await connectDB();
    database = true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
  const config = { database, sessions: jwtConfigured, assistant: Boolean(process.env.GROQ_API_KEY), email: Boolean(process.env.RESEND_API_KEY) };
  res.status(database && jwtConfigured ? 200 : 503).json({ ok: database && jwtConfigured, ...config });
});

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    next(new HttpError(503, 'The database is unavailable right now. Please try again shortly.'));
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', authenticate, catalogRoutes);
app.use('/api/properties', authenticate, propertyRoutes);
app.use('/api/requests', authenticate, requestRoutes);
app.use('/api/suggestions', authenticate, suggestionRoutes);
app.use('/api/vendors', authenticate, adminOnly, vendorRoutes);
app.use('/api/assistant', authenticate, adminOnly, assistantRoutes);

// What needs the admin's attention, for the notification bell and overview.
app.get('/api/activity', authenticate, adminOnly, asyncHandler(async (req, res) => {
  const [submitted, suggestions, signups, recentRequests, recentSuggestions] = await Promise.all([
    Request.countDocuments({ status: 'Submitted' }),
    Suggestion.countDocuments({ status: 'Pending' }),
    User.countDocuments({ role: 'contractor', approved: { $ne: true }, active: true }),
    Request.find({}, { requestId: 1, contractorName: 1, propertyName: 1, status: 1, estimatedTotal: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(8).lean(),
    Suggestion.find({}, { suggestionId: 1, kind: 1, name: 1, price: 1, status: 1, 'submittedBy.name': 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(8).lean()
  ]);
  const events = [
    ...recentRequests.map((r) => ({ type: 'request', id: r.requestId, title: `${r.contractorName} requested materials for ${r.propertyName}`, status: r.status, amount: r.estimatedTotal, at: r.createdAt })),
    ...recentSuggestions.map((s) => ({ type: 'suggestion', id: s.suggestionId, title: `${s.submittedBy?.name || 'A vendor'} suggested ${s.kind === 'price' ? 'a better price for' : ''} ${s.name}`.replace(/\s+/g, ' '), status: s.status, amount: s.price, at: s.createdAt }))
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10);
  res.json({ counts: { submitted, suggestions, signups }, events });
}));

app.use('/api', (req, res, next) => next(new HttpError(404, 'Not found.')));

// Errors: known HttpErrors carry a user-safe message; anything else is logged and hidden.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'That is too much data for one request.' });
  if (error.code === 11000) return res.status(409).json({ error: 'That record already exists.' });
  const status = error.status && error.status < 600 ? error.status : 500;
  if (status >= 500 && !(error instanceof HttpError)) console.error(error);
  res.status(status).json({ error: error instanceof HttpError ? error.message : 'Something went wrong on our side. Please try again.' });
});

export default app;

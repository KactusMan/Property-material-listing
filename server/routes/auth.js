import { Router } from 'express';
import { User } from '../models/User.js';
import { asyncHandler, bad, email, HttpError, password, str } from '../lib/http.js';
import { authenticate, clearSession, clientIp, rateLimit, setSession } from '../lib/security.js';
import { publicUser } from './shared.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => `${clientIp(req)}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many sign-in attempts. Wait 15 minutes and try again.'
});
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: clientIp });

// Vendors register themselves; the account stays pending until an administrator approves it.
router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'Name', { max: 120, required: true });
  const address = email(req.body.email);
  const secret = password(req.body.password);
  const companyName = str(req.body.companyName, 'Company', { max: 160 }) || name;

  if (await User.exists({ email: address })) throw bad('An account with this email already exists. Try signing in.');

  const user = await User.create({
    name,
    email: address,
    password: secret,
    role: 'contractor',
    companyName,
    approved: false,
    lastLoginAt: new Date()
  });
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const address = email(req.body.email);
  const secret = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email: address });
  // Same message for unknown email and wrong password so accounts cannot be enumerated.
  if (!user || !secret || !(await user.matchPassword(secret))) throw new HttpError(401, 'Email or password is incorrect.');
  if (!user.active) throw new HttpError(403, 'This account has been disabled. Contact the administrator.');
  user.lastLoginAt = new Date();
  await user.save();
  setSession(res, user);
  res.json({ user: publicUser(user) });
}));

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;

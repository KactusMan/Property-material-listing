import { Router } from 'express';
import { Product } from '../models/Product.js';
import { asyncHandler, bad } from '../lib/http.js';
import { rateLimit } from '../lib/security.js';
import { runAssistant } from '../lib/assistant.js';

// Mounted behind adminOnly.
const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  key: (req) => String(req.user._id),
  message: 'That is a lot of assistant requests in a minute. Wait a moment and try again.'
});

router.post('/chat', limiter, asyncHandler(async (req, res) => {
  const raw = Array.isArray(req.body.messages) ? req.body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw bad('Type or paste a message first.');

  const products = await Product.find({ active: true }, { productId: 1, name: 1, category: 1, unit: 1, expectedPrice: 1, details: 1 })
    .sort({ category: 1, name: 1 })
    .limit(250)
    .lean();

  res.json(await runAssistant({ messages, products }));
}));

export default router;

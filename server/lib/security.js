import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { HttpError } from './http.js';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// In production a missing or short secret disables sign-in (with a clear 503) rather than
// signing sessions with a guessable key. Locally, a random key just resets sessions on restart.
export const jwtConfigured = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
const JWT_SECRET = jwtConfigured ? process.env.JWT_SECRET : isProduction ? null : crypto.randomBytes(48).toString('hex');

const requireSecret = () => {
  if (!JWT_SECRET) throw new HttpError(503, 'Sign-in is not configured on the server yet (JWT_SECRET is missing or shorter than 32 characters).');
  return JWT_SECRET;
};
const COOKIE = 'mf_session';
const SESSION_DAYS = 7;

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  res.removeHeader('X-Powered-By');
  next();
};

const parseCookies = (header = '') =>
  Object.fromEntries(
    header.split(';').map((part) => {
      const index = part.indexOf('=');
      if (index < 0) return [part.trim(), ''];
      return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    })
  );

export const setSession = (res, user) => {
  const token = jwt.sign({ id: String(user._id), role: user.role }, requireSecret(), {
    expiresIn: `${SESSION_DAYS}d`,
    algorithm: 'HS256'
  });
  res.setHeader('Set-Cookie', [
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${isProduction ? '; Secure' : ''}`
  ]);
};

export const clearSession = (res) => {
  res.setHeader('Set-Cookie', [`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isProduction ? '; Secure' : ''}`]);
};

// State-changing requests must be JSON. Browsers cannot send that cross-site without a CORS
// preflight, which this API never grants, so this doubles as CSRF protection with SameSite cookies.
export const requireJson = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return next(new HttpError(415, 'Requests must be sent as JSON.'));
  }
  next();
};

export const authenticate = async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in.');
    const secret = requireSecret();
    let decoded;
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {
      throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user || !user.active) throw new HttpError(401, 'This account is not active.');
    req.user = user;
    next();
  } catch (error) {
    if (error.status === 401) clearSession(res);
    next(error);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Administrator access is required.'));
  next();
};

export const approvedOnly = (req, res, next) => {
  if (req.user?.role !== 'admin' && !req.user?.approved) {
    return next(new HttpError(403, 'Your account is waiting for administrator approval.'));
  }
  next();
};

// Fixed-window limiter. Serverless instances each keep their own window, so this slows down
// brute force and runaway AI usage rather than guaranteeing an exact global ceiling.
export const rateLimit = ({ windowMs, max, key = (req) => req.ip, message }) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const id = key(req);
    const entry = hits.get(id);
    if (!entry || entry.reset < now) {
      hits.set(id, { count: 1, reset: now + windowMs });
    } else if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return next(new HttpError(429, message || 'Too many attempts. Please wait a minute and try again.'));
    }
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    }
    next();
  };
};

export const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

// Small request helpers: typed input validation and errors that are safe to show to users.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const bad = (message) => new HttpError(400, message);

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const str = (value, label, { max = 500, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${label} is required.`);
    return '';
  }
  if (typeof value !== 'string' && typeof value !== 'number') throw bad(`${label} must be text.`);
  const text = String(value).trim();
  if (required && !text) throw bad(`${label} is required.`);
  if (text.length > max) throw bad(`${label} must be ${max} characters or fewer.`);
  return text;
};

export const num = (value, label, { min = 0, max = 10_000_000, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${label} is required.`);
    return 0;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw bad(`${label} must be a number between ${min} and ${max}.`);
  return Math.round(n * 100) / 100;
};

export const bool = (value) => value === true || value === 'true';

export const oneOf = (value, label, allowed) => {
  if (!allowed.includes(value)) throw bad(`${label} is not valid.`);
  return value;
};

// Only http(s) links are stored, so a saved link can never become a javascript: URL in the UI.
export const link = (value, label) => {
  const text = str(value, label, { max: 2000 });
  if (!text) return '';
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw bad(`${label} must be a full web address starting with https://`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw bad(`${label} must start with https://`);
  }
  parsed.searchParams.delete('utm_source');
  return parsed.toString();
};

export const email = (value, label = 'Email') => {
  const text = str(value, label, { max: 254, required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw bad(`${label} is not a valid email address.`);
  return text;
};

export const password = (value) => {
  if (typeof value !== 'string' || value.length < 10) throw bad('Use a password with at least 10 characters.');
  if (value.length > 200) throw bad('Password is too long.');
  return value;
};

export const idList = (value, label, pattern) => {
  if (!Array.isArray(value)) throw bad(`${label} must be a list.`);
  if (value.length > 500) throw bad(`${label} is too long.`);
  return [...new Set(value.map((v) => str(v, label, { max: 40 })).filter((v) => pattern.test(v)))];
};

// Next sequential ID such as P061 from existing IDs, robust to gaps and deletions.
export const nextId = async (Model, field, prefix, width = 3) => {
  const docs = await Model.find({}, { [field]: 1 }).lean();
  const max = docs.reduce((acc, doc) => {
    const match = String(doc[field] || '').match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

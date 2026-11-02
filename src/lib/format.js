const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdRound = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = (n) => usd.format(Number(n || 0));
export const moneyShort = (n) => (Math.abs(n) >= 1000 ? usdRound.format(n) : usd.format(Number(n || 0)));
export const price = (n) => (Number(n) > 0 ? usd.format(Number(n)) : 'Price TBD');

export const date = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const dateTime = (value) =>
  value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const ago = (value) => {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date(value);
};

export const initials = (name = '') =>
  name
    .split(/[\s|]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export const safeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

export const asinFromUrl = (url = '') => {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)amazon\.com$/.test(hostname)) return '';
    const match = pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : '';
  } catch {
    return '';
  }
};

// Amazon's documented cart-add URL: one click puts every item in the signed-in user's cart.
export const amazonCartUrl = (items) => {
  const params = new URLSearchParams();
  items.forEach((item, index) => {
    params.set(`ASIN.${index + 1}`, item.asin);
    params.set(`Quantity.${index + 1}`, String(Math.max(1, Math.round(item.quantity || 1))));
  });
  return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
};

export const storeLabel = (url = '') => {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('amazon.com')) return 'Amazon';
    if (host.endsWith('homedepot.com')) return 'Home Depot';
    if (host.endsWith('lowes.com')) return "Lowe's";
    return host.replace(/^www\./, '');
  } catch {
    return 'link';
  }
};

export const statusTone = {
  Submitted: 'amber',
  Pending: 'amber',
  Approved: 'green',
  Ordered: 'blue',
  Delivered: '',
  Rejected: 'red'
};

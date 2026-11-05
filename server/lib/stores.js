// Store link helpers shared by request ordering and the purchasing assistant.

const ASIN_PATTERNS = [/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i, /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i, /\/gp\/aw\/d\/([A-Z0-9]{10})/i];

export const ALLOWED_STORE_HOSTS = ['amazon.com', 'homedepot.com', 'lowes.com', 'walmart.com', 'menards.com', 'build.com', 'ferguson.com', 'supplyhouse.com'];

export const hostAllowed = (url) => {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return ALLOWED_STORE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

export const asinFromUrl = (url = '') => {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)amazon\.com$/.test(hostname)) return '';
    for (const pattern of ASIN_PATTERNS) {
      const match = pathname.match(pattern);
      if (match) return match[1].toUpperCase();
    }
  } catch {
    return '';
  }
  return '';
};

// Category and search pages can't be ordered from, so they never count as a found product.
export const isProductPage = (url = '') => {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname.endsWith('amazon.com')) return Boolean(asinFromUrl(url));
    if (hostname.endsWith('homedepot.com')) return pathname.startsWith('/p/');
    if (hostname.endsWith('lowes.com')) return pathname.startsWith('/pd/');
    return true;
  } catch {
    return false;
  }
};

export const storeFromUrl = (url = '') => {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('amazon.com')) return 'Amazon';
    if (host.endsWith('homedepot.com')) return 'Home Depot';
    if (host.endsWith('lowes.com')) return "Lowe's";
    if (host.endsWith('walmart.com')) return 'Walmart';
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

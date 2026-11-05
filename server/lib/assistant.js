import { HttpError } from './http.js';
import { asinFromUrl, hostAllowed, isProductPage, storeFromUrl } from './stores.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const TIMEOUT_MS = 270_000;

// OpenAI's search cannot see Amazon product pages, but price trackers publish them with real
// ASINs. Limiting search to stores and trackers also keeps prices off review and blog sites.
const TRACKER_DOMAINS = ['pricehistory.app', 'camelcamelcamel.com', 'keepa.com'];
const SEARCH_DOMAINS = ['amazon.com', 'homedepot.com', 'lowes.com', ...TRACKER_DOMAINS];

const money = (n) => (n > 0 ? `$${Number(n).toFixed(2)}` : 'no price');

// Only catalogue items that share a word with the conversation are sent, which keeps each
// request, and so its cost, small.
const STOP = new Set(['the', 'and', 'for', 'with', 'need', 'these', 'this', 'that', 'from', 'each', 'inch', 'boss', 'please', 'find', 'cheapest', 'amazon', 'options', 'order', 'requested']);
const words = (text) => (String(text).toLowerCase().match(/[a-z]{3,}/g) || []).map((w) => w.replace(/s$/, '')).filter((w) => !STOP.has(w));

const relevantProducts = (products, messages, limit = 30) => {
  const wanted = new Set(words(messages.slice(-4).map((m) => m.content).join(' ')));
  return products
    .map((p) => ({ p, score: words(`${p.name} ${p.category} ${p.details}`).filter((w) => wanted.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
};

const catalogContext = (products) =>
  products
    .map((p) => `${p.productId} | ${p.name} | ${p.category} | per ${p.unit} | ${money(p.expectedPrice)}${p.details ? ` | ${p.details}` : ''}`)
    .join('\n');

const systemPrompt = (products) => `You are the purchasing assistant for MatFlow, a property renovation company in the Maryland / DC area.
The owner receives material lists from vendors over WhatsApp and pastes them here. Your job is to turn them into an order he can place on Amazon US in one click.

The owner is not technical. Write the way a helpful buyer would text him.
Never stop to ask questions about a list. Pick the most common, budget-friendly option (for example an electric range, standard sizes) and state the assumption in that item's line so he can correct it.

When the message contains materials to buy:
1. Read every item, its quantity (default 1) and any size, finish or model details. Fix obvious typos.
2. Some catalogue entries are labour or project allowances, not products (anything installed, a renovation, refacing, an upgrade, repair, removal, landscaping, painting labour, permits). Do not search for those. Say they are a contractor/service cost, not something to buy online, and quote the catalogue allowance. Appliances (range, stove, oven, fridge, dishwasher, microwave, washer, dryer), fixtures, flooring and hardware are always products, even if the catalogue calls them an allowance: search for them. Keep the requested quantity for anything you do not buy online.
The estimated total must only add items for which you give a store link.
3. For real products, use web search to find the cheapest suitable Amazon US product. Amazon's own pages do not appear in search, so look on price trackers (pricehistory.app, camelcamelcamel.com, keepa.com), which show the Amazon product, its price and its ASIN; give it as https://www.amazon.com/dp/ASIN with store Amazon. Use homedepot.com or lowes.com only when no suitable Amazon product turns up or they are clearly cheaper (flooring, tile, lumber and big appliances often are), and say which store. The url must be one specific product page, never a category or search page.
4. Prefer good-value, well-reviewed items that match the spec. If a noticeably cheaper alternative is just as suitable, choose it and mention the original.
5. Mention when the company catalogue already has a better or similar price.
6. Reply format, nothing else before it:
   - One bullet per item: **Item name** — what to buy, price, store, and a few words why. For items not to buy online, say what to do instead.
   - Then one line: **Estimated total:** amount (only for items with a price).
   Never mention JSON, null, URLs, ASINs, catalogue IDs or this format in the visible reply. Do not paste links in the reply; the order list shows them.
7. Finish with a fenced code block tagged cart (the app hides it and turns it into the order list), containing JSON exactly like:
\`\`\`cart
{"items":[{"name":"InSinkErator Badger 5 garbage disposal","quantity":1,"price":116.41,"url":"https://www.amazon.com/dp/B00004U9JO","asin":"B00004U9JO","store":"Amazon","catalogId":"P013","note":"cheapest 1/2 HP option"}]}
\`\`\`
"quantity" is how many of that listing to add to the cart, and "price" is the price of one listing. Single items keep the requested number: 2 vanities is quantity 2. Convert multi-packs only: 6 lights from a 6-pack listing is quantity 1; 10 hinges from a 4-pack is quantity 3. Say so in the note.
Every item from the owner's list must appear in the cart, in the original order, even when you found no listing (then url, price and asin are null and the note says why).
Use only URLs you actually found. Put null for unknown price, asin or catalogId. Never invent ASINs.
Keep searching efficient: one search per product, and never search for services or allowances.

For other questions (comparisons, specs, quantities, cost estimates), answer directly and concisely. Include a cart block only when there is something to buy.
Prices change constantly; treat search results as current only for today.

Company catalogue (ID | name | category | unit | expected price | details):
${catalogContext(products) || "No matching catalogue items."}`;

const cleanText = (text) =>
  text
    .replace(/\s*\(\[[^\]]*\]\(https?:[^)]*\)\)/g, '')
    .replace(/\[([^\]]*)\]\(https?:[^)]*\)/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const amazonSearch = (name) => `https://www.amazon.com/s?k=${encodeURIComponent(name)}`;

// A link counts as found only if its ASIN or product path appeared in the live search results.
// Models sometimes write plausible-looking placeholders (amazon.com/dp/B0XXXXX); those are dropped.
const seenInResults = (url, asin, evidence) => {
  if (!evidence) return false;
  if (asin) return evidence.includes(asin);
  try {
    const { pathname } = new URL(url);
    const tail = pathname.split('/').filter(Boolean).pop() || '';
    return tail.length >= 6 && evidence.includes(tail);
  } catch {
    return false;
  }
};

const toCartItem = (raw, evidence) => {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim().slice(0, 200);
  if (!name) return null;
  const quantity = Math.min(10000, Math.max(1, Math.round(Number(raw.quantity) || 1)));
  const price = Number(raw.price);
  let url = typeof raw.url === 'string' ? raw.url.trim().replace(/[?&]utm_source=openai$/, '') : '';
  const searched = Boolean(url || raw.asin);
  if (url && !hostAllowed(url)) url = '';
  let asin = typeof raw.asin === 'string' && /^[A-Z0-9]{10}$/i.test(raw.asin) ? raw.asin.toUpperCase() : '';
  const urlAsin = asinFromUrl(url);
  // Trust the ASIN in the URL over a free-text one so the cart link matches the page shown.
  if (urlAsin || url) asin = urlAsin;
  if (asin && !url) url = `https://www.amazon.com/dp/${asin}`;

  const verified = Boolean(url) && isProductPage(url) && seenInResults(url, asin, evidence);
  if (!verified) {
    // An unconfirmed link becomes a plain Amazon search; items the model chose not to search
    // (services, allowances) get no link at all.
    url = searched ? amazonSearch(name) : '';
    asin = '';
  }
  return {
    name,
    quantity,
    price: verified && Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null,
    url,
    asin,
    verified,
    store: verified ? storeFromUrl(url) : '',
    catalogId: typeof raw.catalogId === 'string' && /^P\d{1,5}$/.test(raw.catalogId) ? raw.catalogId : '',
    note: verified || !searched ? String(raw.note || '').trim().slice(0, 240) : 'No confirmed listing found. Opens an Amazon search instead.'
  };
};

// The cart block is machine data for the order list and must never reach the owner as text.
// The model sometimes forgets the closing fence or the fence entirely, so everything from the
// opening marker (or a bare {"items": …}) to the end is treated as the cart.
export const extractCart = (content, evidence = '') => {
  const fenced = [...content.matchAll(/```\s*(?:cart|json)\b/gi)].pop();
  const bare = content.search(/\{\s*"items"\s*:/);
  const start = fenced ? fenced.index : bare;
  if (start < 0) return { text: cleanText(content), cart: [] };

  const block = content.slice(fenced ? start + fenced[0].length : start);
  const tail = block.search(/```/);
  const body = tail >= 0 ? block.slice(0, tail) : block;
  const after = tail >= 0 ? block.slice(tail + 3) : '';
  const from = body.search(/[[{]/);
  const to = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));

  let items = [];
  if (from >= 0 && to > from) {
    try {
      const parsed = JSON.parse(body.slice(from, to + 1));
      items = (Array.isArray(parsed) ? parsed : parsed.items || []).map((raw) => toCartItem(raw, evidence)).filter(Boolean).slice(0, 60);
    } catch {
      items = [];
    }
  }
  return { text: cleanText(`${content.slice(0, start)}\n${after}`), cart: items };
};

// One search per line of the list, with headroom for a second look, caps both time and cost.
const searchBudget = (messages) => {
  const lines = messages[messages.length - 1].content.split('\n').filter((line) => line.trim()).length;
  return Math.min(24, Math.max(4, lines * 2));
};

// The order list only totals confirmed items, so the model's own total could disagree with it.
export const withConfirmedNote = (text, cart) => {
  if (!cart.length) return text;
  const body = text.replace(/^.*estimated total.*$/gim, '').trim();
  const unconfirmed = cart.filter((item) => item.url && !item.verified).length;
  if (!unconfirmed) return body;
  return `${body}\n\n${unconfirmed} item${unconfirmed > 1 ? 's' : ''} could not be confirmed on a store page, so ${unconfirmed > 1 ? 'they are' : 'it is'} left out of the order list total. Check the price with the search link before buying.`;
};

const isTracker = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && TRACKER_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

const trackerPages = async (calls) => {
  const urls = [...new Set(calls.flatMap((call) => (call.action?.sources || []).map((source) => source.url)))].filter(isTracker).slice(0, 15);
  const pages = await Promise.all(
    urls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0 MatFlow link check' } })
        .then((page) => (page.ok ? page.text() : ''))
        .then((html) => html.slice(0, 1_000_000))
        .catch(() => '')
    )
  );
  return pages.join('\n');
};

const failure = async (response) => {
  const body = await response.text();
  console.error('OpenAI error', response.status, body.slice(0, 500));
  if (response.status === 429 && /insufficient_quota|billing/i.test(body)) {
    return new HttpError(402, 'The OpenAI account has run out of credit or hit its spending limit. Add credit at platform.openai.com, then try again.');
  }
  if (response.status === 429) return new HttpError(429, 'The assistant is getting too many requests. Wait a minute and send it again.');
  if (response.status === 401) return new HttpError(503, 'The OpenAI key was rejected. Check OPENAI_API_KEY in the server settings.');
  return new HttpError(502, 'The AI service returned an error. Please try again.');
};

export const runAssistant = async ({ messages, products }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new HttpError(503, 'The assistant is not configured yet. Add OPENAI_API_KEY to the server environment.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        instructions: systemPrompt(relevantProducts(products, messages)),
        input: messages,
        tools: [{
          type: 'web_search',
          filters: { allowed_domains: SEARCH_DOMAINS },
          user_location: { type: 'approximate', country: 'US', region: 'Maryland' }
        }],
        include: ['web_search_call.action.sources'],
        max_tool_calls: searchBudget(messages),
        reasoning: { effort: 'low' },
        max_output_tokens: 8000,
        store: false
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new HttpError(504, 'The assistant took too long. Try a shorter list.');
    throw new HttpError(502, 'Could not reach the AI service. Please try again.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw await failure(response);

  const data = await response.json();
  const output = data.output || [];
  const calls = output.filter((item) => item.type === 'web_search_call');
  const parts = output.filter((item) => item.type === 'message').flatMap((item) => item.content || []);
  const content = parts.map((part) => part.text || '').join('\n');
  // Evidence is what the search tool returned and cited, never the model's own wording. Tracker
  // pages are opened only to confirm an ASIN appears on them; their text never reaches the model.
  const found = JSON.stringify([calls.map((call) => call.action), parts.map((part) => part.annotations)]);
  const evidence = `${found}\n${await trackerPages(calls)}`;
  const { text, cart } = extractCart(content, evidence);
  return {
    reply: withConfirmedNote(text, cart) || 'I could not produce an answer for that. Try rephrasing the list.',
    cart,
    searches: calls.length,
    tokens: data.usage?.total_tokens || 0
  };
};

import { HttpError } from './http.js';
import { asinFromUrl, hostAllowed, storeFromUrl } from './stores.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const money = (n) => (n > 0 ? `$${Number(n).toFixed(2)}` : 'no price');

const catalogContext = (products) =>
  products
    .map((p) => `${p.productId} | ${p.name} | ${p.category} | per ${p.unit} | ${money(p.expectedPrice)}${p.details ? ` | ${p.details}` : ''}`)
    .join('\n');

const systemPrompt = (products) => `You are the purchasing assistant for MatFlow, a property renovation company in the Maryland / DC area.
The owner receives material lists from vendors over WhatsApp and pastes them here. Your job is to turn them into an order he can place on Amazon US in one click.

When the message contains materials to buy:
1. Read every item, its quantity (default 1) and any size, finish or model details. Fix obvious typos.
2. Use browser_search to find the cheapest suitable listing on amazon.com for each item. Prefer listings with a clear product page (amazon.com/dp/ASIN). Only fall back to homedepot.com or lowes.com when Amazon has nothing suitable, and say so.
3. Prefer good-value, well-reviewed items that match the spec. If a noticeably cheaper alternative is just as suitable, choose it and mention the original.
4. Compare with the company catalogue below. If the catalogue already has the item with a better or similar price, say so and include its ID.
5. Reply briefly in plain English: one short line per item with the pick, price and why. Then a line with the estimated total. No preamble.
6. Finish with a fenced code block tagged cart containing JSON exactly like:
\`\`\`cart
{"items":[{"name":"InSinkErator Badger 5 garbage disposal","quantity":1,"price":116.41,"url":"https://www.amazon.com/dp/B00004U9JO","asin":"B00004U9JO","store":"Amazon","catalogId":"P013","note":"cheapest 1/2 HP option"}]}
\`\`\`
"quantity" is how many of that listing to add to the cart. Convert multi-packs: 6 lights from a 6-pack listing is quantity 1; 10 hinges from a 4-pack is quantity 3. Say so in the note.
Every item from the owner's list must appear in the cart, in the original order, even when you found no listing (then url, price and asin are null and the note says why).
Use only URLs you actually found. Put null for unknown price, asin or catalogId. Never invent ASINs.
Keep searching efficient: at most two searches per item.

For other questions (comparisons, specs, quantities, cost estimates), answer directly and concisely. Include a cart block only when there is something to buy.
Prices change constantly; treat search results as current only for today.

Company catalogue (ID | name | category | unit | expected price | details):
${catalogContext(products)}`;

const cleanText = (text) =>
  text
    .replace(/【[^】]*】/g, '')
    .replace(/[ \t]+\n/g, '\n')
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
  let url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (url && !hostAllowed(url)) url = '';
  let asin = typeof raw.asin === 'string' && /^[A-Z0-9]{10}$/i.test(raw.asin) ? raw.asin.toUpperCase() : '';
  const urlAsin = asinFromUrl(url);
  // Trust the ASIN in the URL over a free-text one so the cart link matches the page shown.
  if (urlAsin || url) asin = urlAsin;
  if (asin && !url) url = `https://www.amazon.com/dp/${asin}`;

  const verified = Boolean(url) && seenInResults(url, asin, evidence);
  if (!verified) {
    url = amazonSearch(name);
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
    note: verified ? String(raw.note || '').trim().slice(0, 240) : 'No confirmed listing found. Opens an Amazon search instead.'
  };
};

export const extractCart = (content, evidence = '') => {
  const fence = /```(?:cart|json)\s*([\s\S]*?)```/gi;
  let match;
  let last = null;
  while ((match = fence.exec(content))) last = match;
  if (!last) return { text: cleanText(content), cart: [] };
  let items = [];
  try {
    const parsed = JSON.parse(last[1]);
    items = (Array.isArray(parsed) ? parsed : parsed.items || []).map((raw) => toCartItem(raw, evidence)).filter(Boolean).slice(0, 60);
  } catch {
    items = [];
  }
  const text = cleanText(content.slice(0, last.index) + content.slice(last.index + last[0].length));
  return { text, cart: items };
};

const sourcesFrom = (message) => {
  const seen = new Set();
  const sources = [];
  for (const tool of message.executed_tools || []) {
    const output = String(tool.output || '');
    for (const match of output.matchAll(/https?:\/\/[^\s)\]】†"]+/g)) {
      const url = match[0];
      if (hostAllowed(url) && !seen.has(url) && sources.length < 12) {
        seen.add(url);
        sources.push(url);
      }
    }
  }
  return sources;
};

export const runAssistant = async ({ messages, products }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new HttpError(503, 'The assistant is not configured yet. Add GROQ_API_KEY to the server environment.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt(products) }, ...messages],
        tools: [{ type: 'browser_search' }],
        tool_choice: 'auto',
        reasoning_effort: 'low',
        temperature: 0.3,
        max_completion_tokens: 4096
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new HttpError(504, 'The assistant took too long. Try a shorter list.');
    throw new HttpError(502, 'Could not reach the AI service. Please try again.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new HttpError(429, 'The AI service is busy or over its limit. Wait a minute and try again.');
  if (!response.ok) {
    console.error('Groq error', response.status, (await response.text()).slice(0, 500));
    throw new HttpError(502, 'The AI service returned an error. Please try again.');
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message || {};
  const evidence = (message.executed_tools || []).map((tool) => String(tool.output || '')).join('\n');
  const { text, cart } = extractCart(String(message.content || ''), evidence);
  return {
    reply: text || 'I could not produce an answer for that. Try rephrasing the list.',
    cart,
    sources: sourcesFrom(message),
    searches: (message.executed_tools || []).length
  };
};

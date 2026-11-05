import { HttpError } from './http.js';
import { asinFromUrl, hostAllowed, isProductPage, storeFromUrl } from './stores.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';

const money = (n) => (n > 0 ? `$${Number(n).toFixed(2)}` : 'no price');

// Only catalogue items that share a word with the conversation are sent, which keeps each
// request small enough for Groq's per-minute token limit.
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
3. For real products, use browser_search to find the cheapest suitable listing on amazon.com. Prefer listings with a clear product page (amazon.com/dp/…). Fall back to homedepot.com or lowes.com only when Amazon has nothing suitable (flooring, tile, lumber and big appliances are often cheaper there), and say which store. The url must be one specific product page, never a category or search page.
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
    .replace(/【[^】]*】/g, '')
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
  let url = typeof raw.url === 'string' ? raw.url.trim() : '';
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

// The order list only totals confirmed items, so the model's own total could disagree with it.
export const withConfirmedNote = (text, cart) => {
  if (!cart.length) return text;
  const body = text.replace(/^.*estimated total.*$/gim, '').trim();
  const unconfirmed = cart.filter((item) => item.url && !item.verified).length;
  if (!unconfirmed) return body;
  return `${body}\n\n${unconfirmed} item${unconfirmed > 1 ? 's' : ''} could not be confirmed on a store page, so ${unconfirmed > 1 ? 'they are' : 'it is'} left out of the order list total. Check the price with the search link before buying.`;
};

export const runAssistant = async ({ messages, products }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new HttpError(503, 'The assistant is not configured yet. Add GROQ_API_KEY to the server environment.');

  const payload = (model) =>
    JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt(relevantProducts(products, messages)) }, ...messages],
      tools: [{ type: 'browser_search' }],
      tool_choice: 'auto',
      reasoning_effort: 'low',
      temperature: 0.3,
      // Groq counts this reservation against the per-minute token limit, so keep it modest.
      max_completion_tokens: 2048
    });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  const call = (model) =>
    fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: payload(model),
      signal: controller.signal
    });

  // Free Groq keys have per-minute and per-day token caps for each model. Wait out a short
  // per-minute pause once; if the main model is capped for longer, use the fallback model,
  // which has its own allowance.
  let response;
  let limitMessage = '';
  try {
    for (const model of [...new Set([MODEL, FALLBACK_MODEL])]) {
      response = await call(model);
      const wait = Number(response.headers.get('retry-after'));
      if (response.status === 429 && wait > 0 && wait <= 20) {
        await new Promise((resolve) => setTimeout(resolve, wait * 1000 + 250));
        response = await call(model);
      }
      if (response.status !== 429) break;
      limitMessage = await response.text();
      console.error('Groq rate limit', model, limitMessage.slice(0, 300));
    }
  } catch (error) {
    if (error.name === 'AbortError') throw new HttpError(504, 'The assistant took too long. Try a shorter list.');
    throw new HttpError(502, 'Could not reach the AI service. Please try again.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    const daily = /per day|TPD|RPD/i.test(limitMessage);
    throw new HttpError(
      429,
      daily
        ? 'The assistant has used up today’s free AI allowance. It resets within 24 hours; upgrading the Groq plan removes this limit.'
        : 'The assistant has hit its per-minute AI limit. Wait about a minute and send it again.'
    );
  }
  if (!response.ok) {
    console.error('Groq error', response.status, (await response.text()).slice(0, 500));
    throw new HttpError(502, 'The AI service returned an error. Please try again.');
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message || {};
  const evidence = (message.executed_tools || []).map((tool) => String(tool.output || '')).join('\n');
  const { text, cart } = extractCart(String(message.content || ''), evidence);
  return {
    reply: withConfirmedNote(text, cart) || 'I could not produce an answer for that. Try rephrasing the list.',
    cart,
    searches: (message.executed_tools || []).length
  };
};

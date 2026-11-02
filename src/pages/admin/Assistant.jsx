import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Copy, ShoppingCartSimple, Trash } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { amazonCartUrl, money, safeUrl, storeLabel } from '../../lib/format';
import { ExternalLink, PageHead, useToast } from '../../components/ui';

const STORAGE_KEY = 'mf_assistant_v1';

const STARTERS = [
  'Paste the WhatsApp message exactly as you got it. Example:\n2 bathroom vanity 24 inch white\n6 LED recessed lights 6"\n1 garbage disposal 1/2 hp\n3 boxes LVP grey oak',
  'Which is cheaper per square foot right now: Lifeproof Sterling Oak LVP at Home Depot or a comparable LVP on Amazon?',
  'I need to redo a 5×8 bathroom on a budget. List the materials I should buy with Amazon picks and a total.'
];

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

// Minimal, safe rendering of the model's markdown: paragraphs, bullet lists, **bold** and bare links.
function inline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      const url = safeUrl(part.replace(/[.,;:]+$/, ''));
      return url ? <ExternalLink key={key} href={url}>{storeLabel(url)}</ExternalLink> : part;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function Markdown({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/^#+\s*/, '').trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: 'ul', items: list, key: i });
      }
      list.push(bullet[1]);
    } else if (line.trim()) {
      list = null;
      blocks.push({ type: 'p', text: line, key: i });
    } else {
      list = null;
    }
  });
  return blocks.map((b) =>
    b.type === 'ul' ? (
      <ul key={b.key}>{b.items.map((item, j) => <li key={j}>{inline(item, `${b.key}-${j}`)}</li>)}</ul>
    ) : (
      <p key={b.key}>{inline(b.text, b.key)}</p>
    )
  );
}

function CartPanel({ cart, setCart, onSaveToCatalog }) {
  const toast = useToast();
  const selected = cart.filter((i) => i.selected);
  const amazon = selected.filter((i) => i.asin);
  const others = selected.filter((i) => !i.asin && i.url);
  const total = selected.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const update = (index, patch) => setCart(cart.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const copy = async () => {
    const text = selected
      .map((i) => `${i.quantity} × ${i.name}${i.price ? ` – ${money(i.price)}` : ''}${i.url ? `\n${i.url}` : ''}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(`${text}\n\nEstimated total: ${money(total)}`);
      toast('Order list copied. Paste it into WhatsApp or an email.');
    } catch {
      toast('Copy is blocked in this browser.', 'error');
    }
  };

  return (
    <aside className="panel cart-panel" aria-label="Order from this conversation">
      <div className="panel-head">
        <h2>Order list</h2>
        <span className="muted small"><span className="num">{selected.length}</span> of {cart.length} selected</span>
      </div>
      {cart.map((item, index) => (
        <div className="cart-item" key={`${item.name}-${index}`}>
          <input type="checkbox" checked={item.selected} onChange={(e) => update(index, { selected: e.target.checked })} aria-label={`Include ${item.name}`} />
          <div style={{ minWidth: 0 }}>
            <div className="name">{item.name}</div>
            <div className="sub">
              {item.price ? <span className="num">{money(item.price)}</span> : 'no price found'}
              {item.store ? ` · ${item.store}` : ''}
              {item.catalogId ? ` · catalogue ${item.catalogId}` : ''}
            </div>
            {item.note && <div className="sub">{item.note}</div>}
            <div className="links">
              <ExternalLink href={item.url}>{item.verified === false ? 'Search on Amazon' : 'View listing'}</ExternalLink>
              {item.price && item.url && item.verified !== false && !item.saved && (
                <button className="text-link" onClick={() => onSaveToCatalog(item, index)}>
                  {item.catalogId ? 'Update catalogue price' : 'Add to catalogue'}
                </button>
              )}
              {item.saved && <span className="muted">Saved to catalogue</span>}
            </div>
          </div>
          <input className="input qty" type="number" min="1" value={item.quantity} onChange={(e) => update(index, { quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label={`Quantity of ${item.name}`} />
        </div>
      ))}
      <div className="summary-total">
        <span>Estimated total</span>
        <span className="num">{money(total)}</span>
      </div>
      <div className="cart-actions">
        {amazon.length > 0 ? (
          <ExternalLink className="btn btn-primary" href={amazonCartUrl(amazon)}>
            <ShoppingCartSimple size={18} /> Add {amazon.length} to Amazon cart
          </ExternalLink>
        ) : (
          <button className="btn btn-primary" disabled>No Amazon items selected</button>
        )}
        {others.length > 0 && (
          <p className="small muted">
            {others.length} item{others.length > 1 ? 's have' : ' has'} no confirmed Amazon product page (another store or a search). Open {others.length > 1 ? 'them' : 'it'} with “View listing”.
          </p>
        )}
        <button className="btn" onClick={copy} disabled={!selected.length}><Copy size={16} /> Copy order list</button>
        <p className="small muted">Amazon opens with these items in your cart. Review sizes and sellers there before checking out.</p>
      </div>
    </aside>
  );
}

export default function Assistant({ draft }) {
  const toast = useToast();
  const [messages, setMessages] = useState(load);
  const [input, setInput] = useState(draft || '');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  const lastCartIndex = useMemo(() => messages.map((m, i) => (m.cart?.length ? i : -1)).filter((i) => i >= 0).pop() ?? -1, [messages]);
  const cart = lastCartIndex >= 0 ? messages[lastCartIndex].cart : [];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // History is a convenience; ignore storage failures.
    }
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (draft) {
      setInput(draft);
      inputRef.current?.focus();
    }
  }, [draft]);

  const setCart = (next) => setMessages((list) => list.map((m, i) => (i === lastCartIndex ? { ...m, cart: next } : m)));

  const send = async (text = input) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const result = await api('/api/assistant/chat', {
        method: 'POST',
        body: { messages: next.map(({ role, content: c, cart: items }) => ({ role, content: items?.length ? `${c}\n\n(Order list: ${items.map((x) => `${x.quantity} × ${x.name}${x.price ? ` @ $${x.price}` : ''}`).join('; ')})` : c })) }
      });
      setMessages((list) => [...list, { role: 'assistant', content: result.reply, cart: result.cart.map((item) => ({ ...item, selected: true })), searches: result.searches, at: Date.now() }]);
    } catch (err) {
      setMessages((list) => [...list, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const saveToCatalog = async (item, index) => {
    try {
      if (item.catalogId) {
        await api(`/api/products/${item.catalogId}/price`, { method: 'PATCH', body: { expectedPrice: item.price, supplierLink: item.url } });
      } else {
        await api('/api/products', { method: 'POST', body: { name: item.name, category: 'General', unit: 'each', expectedPrice: item.price, supplierLink: item.url, notes: item.note, source: 'assistant' } });
      }
      setCart(cart.map((c, i) => (i === index ? { ...c, saved: true } : c)));
      toast(item.catalogId ? 'Catalogue price updated.' : 'Added to the catalogue under General.');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
  };

  return (
    <>
      <PageHead title="Buying assistant" sub="Paste what vendors send on WhatsApp. The assistant searches Amazon for the cheapest suitable item, checks your catalogue, and builds a cart you can open in one click.">
        {messages.length > 0 && <button className="btn btn-ghost" onClick={() => setMessages([])}><Trash size={16} /> New conversation</button>}
      </PageHead>
      <div className="assistant-layout">
        <section className="chat" aria-label="Conversation">
          <div className="chat-log" ref={logRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="starter-list">
                <p className="muted small">Try one of these, or paste your own list:</p>
                {STARTERS.map((s) => (
                  <button key={s} className="starter" onClick={() => { setInput(s.startsWith('Paste') ? s.split('\n').slice(1).join('\n') : s); inputRef.current?.focus(); }}>
                    {s.split('\n')[0]}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === 'user' ? m.content : (
                  <>
                    <div style={m.error ? { color: 'var(--red-ink)' } : undefined}><Markdown text={m.content} /></div>
                    {(m.searches > 0 || m.cart?.length > 0) && (
                      <div className="msg-meta">
                        {m.searches > 0 && <span>{m.searches} web search{m.searches > 1 ? 'es' : ''}</span>}
                        {m.cart?.length > 0 && <span>{m.cart.length} item{m.cart.length > 1 ? 's' : ''} in the order list</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {busy && (
              <div className="msg assistant">
                <span className="thinking"><i /><i /><i /> Searching stores and comparing prices</span>
              </div>
            )}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label className="visually-hidden" htmlFor="assistant-input">Message</label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              className="textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Paste the materials list from WhatsApp, or ask about a product"
              maxLength={8000}
            />
            <div className="composer-row">
              <span className="small muted hide-mobile">Ctrl + Enter to send</span>
              <button className="btn btn-primary" disabled={busy || !input.trim()}>
                <ArrowUp size={16} weight="bold" /> {busy ? 'Working…' : 'Find best prices'}
              </button>
            </div>
          </form>
        </section>

        {cart.length > 0 ? (
          <CartPanel cart={cart} setCart={setCart} onSaveToCatalog={saveToCatalog} />
        ) : (
          <aside className="panel panel-pad hide-mobile">
            <h2 style={{ fontSize: 15, marginBottom: 8 }}>How it works</h2>
            <ul className="timeline" style={{ gap: 10 }}>
              <li>1. Paste the list a vendor sent you.</li>
              <li>2. The assistant reads each item, searches Amazon live and picks the cheapest suitable listing.</li>
              <li>3. Untick anything you do not want, fix quantities.</li>
              <li>4. “Add to Amazon cart” opens Amazon with everything already in your cart.</li>
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}

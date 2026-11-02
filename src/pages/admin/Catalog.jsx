import { useMemo, useState } from 'react';
import { MagnifyingGlassPlus, Plus, Tag } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { date, money, price } from '../../lib/format';
import { Empty, ExternalLink, Field, LoadError, PageHead, SearchInput, Segmented, Sheet, Skeleton, Switch, useResource, useToast } from '../../components/ui';

const blank = { name: '', category: '', unit: 'each', details: '', supplierLink: '', expectedPrice: '', notes: '' };

export const priceCheckPrompt = (p) =>
  `Find the cheapest current Amazon US listing for: ${p.name}${p.details ? ` (${p.details})` : ''}, sold per ${p.unit}. Our catalogue price is ${p.expectedPrice > 0 ? money(p.expectedPrice) : 'not set'}.`;

function ProductSheet({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(product ? { ...blank, ...product } : blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = await api(product ? `/api/products/${product.productId}` : '/api/products', { method: product ? 'PUT' : 'POST', body: form });
      toast(product ? 'Material updated.' : 'Material added to the catalogue.');
      onSaved(saved, !product);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={product ? product.name : 'New material'}
      sub={product ? `${product.productId} · updated ${date(product.updatedAt)}` : 'Vendors see active materials when they order.'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="product-form" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      )}
    >
      <form id="product-form" className="form-grid" onSubmit={save}>
        <Field label="Name"><input className="input" value={form.name} onChange={set('name')} required maxLength={160} /></Field>
        <div className="form-row">
          <Field label="Category">
            <input className="input" list="catalog-categories" value={form.category} onChange={set('category')} required maxLength={60} />
            <datalist id="catalog-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Unit"><input className="input" value={form.unit} onChange={set('unit')} maxLength={30} /></Field>
        </div>
        <div className="form-row">
          <Field label="Expected price (USD)"><input className="input num" type="number" step="0.01" min="0" value={form.expectedPrice} onChange={set('expectedPrice')} /></Field>
          <Field label="Size, model, color"><input className="input" value={form.details} onChange={set('details')} maxLength={300} /></Field>
        </div>
        <Field label="Product link" hint="An amazon.com/dp/… link lets approved requests go straight into the Amazon cart.">
          <input className="input" type="url" value={form.supplierLink} onChange={set('supplierLink')} placeholder="https://www.amazon.com/dp/…" />
        </Field>
        <Field label="Internal notes"><textarea className="textarea" value={form.notes} onChange={set('notes')} maxLength={500} /></Field>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
      {product?.priceHistory?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Price history</h3>
          <ul className="timeline">
            {[...product.priceHistory].reverse().map((h, i) => (
              <li key={i}><span className="num">{price(h.price)}</span> · {h.source} · {date(h.changedAt)}</li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}

export default function Catalog({ navigate }) {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useResource('/api/products');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('active');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => data || [], [data]);
  const categories = useMemo(() => [...new Set(list.map((p) => p.category))].sort(), [list]);
  const needsPrice = list.filter((p) => p.active && !(p.expectedPrice > 0)).length;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (view === 'active' && !p.active) return false;
      if (view === 'inactive' && p.active) return false;
      if (view === 'price' && (p.expectedPrice > 0 || !p.active)) return false;
      if (category && p.category !== category) return false;
      return !q || `${p.name} ${p.details} ${p.category} ${p.productId}`.toLowerCase().includes(q);
    });
  }, [list, query, view, category]);

  const toggle = async (product, active) => {
    setData((rows) => rows.map((r) => (r.productId === product.productId ? { ...r, active } : r)));
    try {
      await api(`/api/products/${product.productId}/active`, { method: 'PATCH', body: { active } });
    } catch (err) {
      setData((rows) => rows.map((r) => (r.productId === product.productId ? { ...r, active: !active } : r)));
      toast(err.message, 'error');
    }
  };

  if (error) return <LoadError error={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Catalogue" sub="What vendors can order, at the price you expect to pay. Switch an item off to hide it from vendors.">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} weight="bold" /> Add material</button>
      </PageHead>
      <div className="toolbar">
        <Segmented
          label="Show"
          value={view}
          onChange={setView}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'price', label: 'Needs a price', count: needsPrice },
            { value: 'inactive', label: 'Hidden' },
            { value: 'all', label: 'All' }
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search materials" />
        <select className="select" style={{ width: 'auto', minWidth: 160 }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <Skeleton rows={8} height={44} />
      ) : shown.length === 0 ? (
        <div className="panel"><Empty icon={Tag} title="No materials match">Clear the search or pick another filter.</Empty></div>
      ) : (
        <>
          <div className="panel table-wrap table-desktop">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th className="right">Price</th>
                  <th>Link</th>
                  <th>Visible</th>
                  <th><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.productId} className={p.active ? '' : 'inactive'}>
                    <td>
                      <button className="text-link" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 550, textAlign: 'left' }} onClick={() => setEditing(p)}>{p.name}</button>
                      <div className="cell-sub">{p.productId}{p.details ? ` · ${p.details}` : ''}</div>
                    </td>
                    <td>{p.category}</td>
                    <td className="right">
                      <span className={`num ${p.expectedPrice > 0 ? '' : 'muted'}`}>{price(p.expectedPrice)}</span>
                      <div className="cell-sub">per {p.unit}</div>
                    </td>
                    <td><ExternalLink href={p.supplierLink}>{p.store || 'Open'}</ExternalLink></td>
                    <td><Switch checked={p.active} onChange={(v) => toggle(p, v)} label={`${p.name} visible to vendors`} /></td>
                    <td className="right">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('assistant', { draft: priceCheckPrompt(p) })} title="Check the current price with the assistant">
                        <MagnifyingGlassPlus size={16} /> Check price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cards">
            {shown.map((p) => (
              <div key={p.productId} className="card">
                <div className="card-top">
                  <button className="text-link" style={{ color: 'inherit', textDecoration: 'none', textAlign: 'left' }} onClick={() => setEditing(p)}>
                    <h3>{p.name}</h3>
                  </button>
                  <Switch checked={p.active} onChange={(v) => toggle(p, v)} label={`${p.name} visible to vendors`} />
                </div>
                <div className="card-meta">
                  <span>{p.category}</span>
                  <span className="num">{price(p.expectedPrice)} / {p.unit}</span>
                  <ExternalLink href={p.supplierLink}>{p.store || 'Link'}</ExternalLink>
                  <button className="text-link" onClick={() => navigate('assistant', { draft: priceCheckPrompt(p) })}>Check price</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <ProductSheet
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved, created) => {
            setData((rows) => (created ? [...rows, saved] : rows.map((r) => (r.productId === saved.productId ? saved : r))));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { date, money, price } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { ExternalLink, Field, LoadError, PageHead, Segmented, Skeleton, StatusBadge, useResource, useToast } from '../../components/ui';
import { PendingApproval } from './OrderMaterials';

const blank = { name: '', category: '', unit: 'each', productId: '', price: '', supplierLink: '', details: '', notes: '' };

// A vendor proposes a new material or a cheaper source for an existing one; the admin approves it.
export default function Suggest({ user }) {
  const { t, statusText } = useI18n();
  const toast = useToast();
  const products = useResource(user.approved ? '/api/products' : null);
  const mine = useResource(user.approved ? '/api/suggestions' : null);
  const [kind, setKind] = useState('new');
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const categories = useMemo(() => [...new Set((products.data || []).map((p) => p.category))].sort(), [products.data]);
  const current = (products.data || []).find((p) => p.productId === form.productId);

  if (!user.approved) return <PendingApproval />;
  if (products.error) return <LoadError error={products.error} onRetry={products.reload} />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await api('/api/suggestions', { method: 'POST', body: { ...form, kind } });
      mine.setData((list) => [created, ...(list || [])]);
      setForm(blank);
      toast(t('suggestionSent'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title={t('suggestTitle')} sub={t('suggestSub')} />
      <div className="overview-grid">
        <form className="panel panel-pad form-grid" onSubmit={submit}>
          <Segmented label="Suggestion type" value={kind} onChange={(v) => { setKind(v); setError(''); }} options={[{ value: 'new', label: t('suggestNew') }, { value: 'price', label: t('suggestPrice') }]} />

          {kind === 'price' ? (
            <Field label={t('whichMaterial')} hint={current ? `${t('currentPrice')}: ${price(current.expectedPrice)} / ${current.unit}` : undefined}>
              <select className="select" value={form.productId} onChange={set('productId')} required>
                <option value="">{t('select')}</option>
                {categories.map((c) => (
                  <optgroup key={c} label={c}>
                    {(products.data || []).filter((p) => p.category === c).map((p) => (
                      <option key={p.productId} value={p.productId}>{p.name}{p.details ? ` (${p.details})` : ''}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label={t('materialName')}>
                <input className="input" value={form.name} onChange={set('name')} required maxLength={160} />
              </Field>
              <div className="form-row">
                <Field label={t('category')}>
                  <input className="input" list="category-options" value={form.category} onChange={set('category')} maxLength={60} />
                  <datalist id="category-options">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                </Field>
                <Field label={t('unit')}>
                  <input className="input" value={form.unit} onChange={set('unit')} maxLength={30} />
                </Field>
              </div>
            </>
          )}

          <div className="form-row">
            <Field label={t('priceFound')}>
              <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.price} onChange={set('price')} required />
            </Field>
            <Field label={t('details')}>
              <input className="input" value={form.details} onChange={set('details')} maxLength={300} />
            </Field>
          </div>
          <Field label={t('productLink')} hint={t('productLinkHint')}>
            <input className="input" type="url" inputMode="url" value={form.supplierLink} onChange={set('supplierLink')} placeholder="https://www.amazon.com/dp/…" required />
          </Field>
          <Field label={t('why')}>
            <textarea className="textarea" value={form.notes} onChange={set('notes')} maxLength={600} />
          </Field>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? t('sending') : t('sendSuggestion')}</button>
        </form>

        <section className="panel">
          <div className="panel-head"><h2>{t('mySuggestions')}</h2></div>
          {mine.loading ? (
            <div style={{ padding: 20 }}><Skeleton rows={3} /></div>
          ) : !mine.data?.length ? (
            <p className="muted small" style={{ padding: '0 20px 20px' }}>{t('noSuggestions')}</p>
          ) : (
            <ul className="list">
              {mine.data.map((s) => (
                <li key={s.suggestionId}>
                  <div className="list-row" style={{ alignItems: 'flex-start' }}>
                    <span className="grow">
                      <span className="title">{s.name}</span>
                      <span className="sub">
                        {s.kind === 'price' ? t('suggestPrice') : t('suggestNew')} · <span className="num">{money(s.price)}</span> · {date(s.createdAt)}
                      </span>
                      {s.reviewNote && <span className="sub" style={{ whiteSpace: 'normal' }}>{t('officeNote')}: {s.reviewNote}</span>}
                      <ExternalLink href={s.supplierLink} className="text-link small">{s.store || t('open')}</ExternalLink>
                    </span>
                    <StatusBadge status={s.status} label={statusText(s.status)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

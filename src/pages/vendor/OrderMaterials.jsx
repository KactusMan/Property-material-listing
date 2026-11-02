import { useMemo, useState } from 'react';
import { HourglassMedium, MapPin, MapPinSimpleArea, Plus } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { money, price } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { Empty, Field, LoadError, PageHead, SearchInput, Segmented, Sheet, Skeleton, Stepper, useResource, useToast } from '../../components/ui';

export function PendingApproval() {
  const { t } = useI18n();
  return (
    <>
      <PageHead title={t('pendingTitle')} />
      <div className="panel">
        <Empty icon={HourglassMedium} title={t('pendingTitle')}>{t('pendingBody')}</Empty>
      </div>
    </>
  );
}

function OrderSummary({ lines, notes, setNotes, onSubmit, busy, t }) {
  const total = lines.reduce((sum, l) => sum + l.quantity * l.product.expectedPrice, 0);
  return (
    <>
      {lines.length === 0 ? (
        <p className="muted small" style={{ padding: '0 20px 16px' }}>{t('nothingSelected')}</p>
      ) : (
        <ul className="summary-items">
          {lines.map((l) => (
            <li key={l.product.productId}>
              <span>
                {l.product.name}
                <span className="muted small"> × <span className="num">{l.quantity}</span> {l.product.unit}</span>
              </span>
              <span className="num">{money(l.quantity * l.product.expectedPrice)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="summary-total">
        <span>{t('estimatedTotal')}</span>
        <span className="num">{money(total)}</span>
      </div>
      <div className="summary-body">
        <Field label={t('notes')}>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesPlaceholder')} maxLength={1000} />
        </Field>
        <button className="btn btn-primary btn-block" disabled={!lines.length || busy} onClick={onSubmit}>
          {busy ? t('sending') : t('submitRequest')}
        </button>
      </div>
    </>
  );
}

export default function OrderMaterials({ user, navigate }) {
  const { t } = useI18n();
  const toast = useToast();
  const properties = useResource(user.approved ? '/api/properties' : null);
  const products = useResource(user.approved ? '/api/products' : null);
  const [propertyId, setPropertyId] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const list = useMemo(() => products.data || [], [products.data]);
  const categories = useMemo(() => [...new Set(list.map((p) => p.category))].sort(), [list]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => (category === 'all' || p.category === category) && (!q || `${p.name} ${p.details} ${p.category}`.toLowerCase().includes(q)));
  }, [list, query, category]);
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filtered) map.set(p.category, [...(map.get(p.category) || []), p]);
    return [...map.entries()];
  }, [filtered]);
  const lines = list.filter((p) => quantities[p.productId] > 0).map((p) => ({ product: p, quantity: quantities[p.productId] }));

  if (!user.approved) return <PendingApproval />;
  if (properties.error || products.error) return <LoadError error={properties.error || products.error} onRetry={() => { properties.reload(); products.reload(); }} />;

  const myProperties = properties.data || [];
  const selectedProperty = myProperties.length === 1 ? myProperties[0].propertyId : propertyId;

  const submit = async () => {
    if (!selectedProperty) {
      toast(t('chooseProperty'), 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/api/requests', {
        method: 'POST',
        body: { propertyId: selectedProperty, notes, items: lines.map((l) => ({ productId: l.product.productId, quantity: l.quantity })) }
      });
      toast(t('requestSent'));
      setQuantities({});
      setNotes('');
      setReviewOpen(false);
      navigate('my-requests');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const summaryProps = { lines, notes, setNotes, onSubmit: submit, busy, t };

  return (
    <>
      <PageHead title={t('newRequest')} sub={user.companyName} />

      {properties.loading || products.loading ? (
        <Skeleton rows={6} />
      ) : myProperties.length === 0 ? (
        <div className="panel">
          <Empty icon={MapPinSimpleArea} title={t('noProperties')}>{t('noPropertiesBody')}</Empty>
        </div>
      ) : (
        <div className="order-layout">
          <div>
            <div className="step-label"><b>1</b>{t('chooseProperty')}</div>
            <div className="property-picker" role="group" aria-label={t('chooseProperty')}>
              {myProperties.map((p) => (
                <button key={p.propertyId} className="property-option" aria-pressed={selectedProperty === p.propertyId} onClick={() => setPropertyId(p.propertyId)}>
                  <MapPin size={18} weight={selectedProperty === p.propertyId ? 'fill' : 'regular'} />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="step-label"><b>2</b>{t('chooseMaterials')}</div>
            <div className="toolbar">
              <SearchInput value={query} onChange={setQuery} placeholder={t('searchMaterials')} />
            </div>
            <div className="toolbar">
              <Segmented label="Category" value={category} onChange={setCategory} options={[{ value: 'all', label: t('all') }, ...categories.map((c) => ({ value: c, label: c }))]} />
            </div>
            <div className="catalog-list">
              {grouped.length === 0 && <Empty title={t('searchMaterials')}>—</Empty>}
              {grouped.map(([group, items]) => (
                <section className="catalog-group" key={group}>
                  <h3>{group}</h3>
                  {items.map((p) => {
                    const qty = quantities[p.productId] || 0;
                    return (
                      <div key={p.productId} className={`catalog-item ${qty > 0 ? 'selected' : ''}`}>
                        <div>
                          <div className="name">{p.name}</div>
                          <div className="meta">
                            <span className="num">{price(p.expectedPrice)}</span> {t('perUnit')} {p.unit}
                            {p.details ? ` · ${p.details}` : ''}
                          </div>
                        </div>
                        {qty > 0 ? (
                          <Stepper label={p.name} value={qty} onChange={(n) => setQuantities({ ...quantities, [p.productId]: n })} />
                        ) : (
                          <button className="btn btn-sm" onClick={() => setQuantities({ ...quantities, [p.productId]: 1 })}>
                            <Plus size={14} weight="bold" /> {t('add')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="mobile-cart-bar">
                <div>
                  <div className="small"><span className="num">{lines.length}</span> {t('items')}</div>
                  <strong className="num">{money(lines.reduce((s, l) => s + l.quantity * l.product.expectedPrice, 0))}</strong>
                </div>
                <button className="btn btn-primary" onClick={() => setReviewOpen(true)}>{t('reviewOrder')}</button>
              </div>
            )}
          </div>

          <aside className="panel summary" aria-label={t('yourOrder')}>
            <div className="panel-head"><h2>{t('yourOrder')}</h2></div>
            <OrderSummary {...summaryProps} />
          </aside>
        </div>
      )}

      {reviewOpen && (
        <Sheet title={t('yourOrder')} sub={myProperties.find((p) => p.propertyId === selectedProperty)?.name} onClose={() => setReviewOpen(false)}>
          <div className="panel" style={{ paddingTop: 12 }}>
            <OrderSummary {...summaryProps} />
          </div>
        </Sheet>
      )}
    </>
  );
}

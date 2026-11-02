import { useMemo, useState } from 'react';
import { Lightbulb } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { date, money, price } from '../../lib/format';
import { Empty, ExternalLink, Field, LoadError, PageHead, Segmented, Sheet, Skeleton, StatusBadge, useResource, useToast } from '../../components/ui';

function Review({ suggestion, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ price: suggestion.price, name: suggestion.name, category: suggestion.category, note: '' });
  const [busy, setBusy] = useState('');
  const pending = suggestion.status === 'Pending';
  const saving = suggestion.kind === 'price' && suggestion.currentPrice > 0 ? suggestion.currentPrice - suggestion.price : 0;

  const review = async (action) => {
    setBusy(action);
    try {
      const updated = await api(`/api/suggestions/${suggestion.suggestionId}/review`, { method: 'POST', body: { action, ...form } });
      toast(action === 'reject' ? 'Suggestion rejected.' : updated.kind === 'price' ? `New price saved for ${updated.name}.` : `${updated.name} is now in the catalogue.`);
      onDone(updated);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <Sheet
      title={suggestion.name}
      sub={`${suggestion.kind === 'price' ? 'Better price' : 'New material'} from ${suggestion.submittedBy?.name || 'a vendor'} · ${date(suggestion.createdAt)}`}
      onClose={onClose}
      footer={pending && (
        <>
          <button className="btn btn-danger" disabled={!!busy} onClick={() => review('reject')}>{busy === 'reject' ? 'Saving…' : 'Reject'}</button>
          <button className="btn btn-primary" disabled={!!busy} onClick={() => review('approve')}>
            {busy === 'approve' ? 'Saving…' : suggestion.kind === 'price' ? 'Approve new price' : 'Add to catalogue'}
          </button>
        </>
      )}
    >
      <StatusBadge status={suggestion.status} />
      <dl className="detail-grid">
        <dt>Found at</dt>
        <dd><ExternalLink href={suggestion.supplierLink}>{suggestion.store || 'Open link'}</ExternalLink></dd>
        <dt>Their price</dt>
        <dd className="num">{money(suggestion.price)} / {suggestion.unit}</dd>
        {suggestion.kind === 'price' && (
          <>
            <dt>Catalogue now</dt>
            <dd className="num">{price(suggestion.currentPrice)}{saving > 0 && <span className="badge green plain" style={{ marginLeft: 8 }}>saves {money(saving)}</span>}</dd>
          </>
        )}
        {suggestion.details && (<><dt>Details</dt><dd>{suggestion.details}</dd></>)}
        {suggestion.notes && (<><dt>Vendor's note</dt><dd>{suggestion.notes}</dd></>)}
        <dt>Vendor</dt>
        <dd>{suggestion.submittedBy?.name} <span className="muted small">{suggestion.submittedBy?.email}</span></dd>
        {!pending && (<><dt>Reviewed</dt><dd>{date(suggestion.reviewedAt)} by {suggestion.reviewedBy}{suggestion.reviewNote ? ` · ${suggestion.reviewNote}` : ''}</dd></>)}
      </dl>

      {pending && (
        <div className="form-grid">
          {suggestion.kind === 'new' && (
            <div className="form-row">
              <Field label="Catalogue name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Category"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            </div>
          )}
          <Field label="Price to save (USD)" hint="Correct it here if the listing price differs.">
            <input className="input num" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Note to the vendor (optional)">
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export default function Suggestions({ refreshActivity }) {
  const { data, error, loading, reload, setData } = useResource('/api/suggestions');
  const [filter, setFilter] = useState('Pending');
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => data || [], [data]);
  const shown = useMemo(() => list.filter((s) => filter === 'All' || s.status === filter), [list, filter]);
  const open = list.find((s) => s.suggestionId === openId);

  if (error) return <LoadError error={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Vendor suggestions" sub="New materials and better prices vendors found. Nothing reaches the catalogue until you approve it." />
      <div className="toolbar">
        <Segmented
          label="Status"
          value={filter}
          onChange={setFilter}
          options={['Pending', 'Approved', 'Rejected', 'All'].map((f) => ({ value: f, label: f, count: f === 'Pending' ? list.filter((s) => s.status === 'Pending').length : 0 }))}
        />
      </div>
      {loading ? (
        <Skeleton rows={5} height={56} />
      ) : shown.length === 0 ? (
        <div className="panel">
          <Empty icon={Lightbulb} title={filter === 'Pending' ? 'No suggestions waiting' : 'Nothing here'}>
            Vendors can suggest new materials or cheaper sources from their portal. They show up here for review.
          </Empty>
        </div>
      ) : (
        <div className="panel">
          <ul className="list">
            {shown.map((s, i) => {
              const saving = s.kind === 'price' && s.currentPrice > 0 ? s.currentPrice - s.price : 0;
              return (
                <li key={s.suggestionId} style={i === 0 ? { borderTop: 0 } : undefined}>
                  <button className="list-row" onClick={() => setOpenId(s.suggestionId)}>
                    <span className="grow">
                      <span className="title">{s.name}</span>
                      <span className="sub">
                        {s.kind === 'price' ? 'Better price' : 'New material'} · {s.submittedBy?.name} · {date(s.createdAt)}
                      </span>
                    </span>
                    <span className="end">
                      <span className="num">{money(s.price)}</span>
                      {saving > 0 ? <span className="badge green plain">−{money(saving)}</span> : <StatusBadge status={s.status} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {open && (
        <Review
          suggestion={open}
          onClose={() => setOpenId(null)}
          onDone={(updated) => {
            setData((rows) => rows.map((r) => (r.suggestionId === updated.suggestionId ? updated : r)));
            setOpenId(null);
            refreshActivity();
          }}
        />
      )}
    </>
  );
}

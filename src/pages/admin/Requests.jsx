import { useMemo, useState } from 'react';
import { ClipboardText, Robot, ShoppingCartSimple } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { amazonCartUrl, asinFromUrl, date, dateTime, money } from '../../lib/format';
import { Empty, ExternalLink, LoadError, PageHead, SearchInput, Segmented, Sheet, Skeleton, StatusBadge, useResource, useToast } from '../../components/ui';

const FILTERS = ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Rejected', 'All'];

const NEXT_STEPS = {
  Submitted: [['Approved', 'Approve', 'btn-primary'], ['Rejected', 'Reject', 'btn-danger']],
  Approved: [['Ordered', 'Mark as ordered', 'btn-primary']],
  Ordered: [['Delivered', 'Mark as delivered', 'btn-primary']],
  Rejected: [['Submitted', 'Reopen', '']]
};

export const requestToPrompt = (r) =>
  `Find the cheapest Amazon options for this order (${r.propertyName}, requested by ${r.contractorName}):\n${r.items
    .map((i) => `- ${i.quantity} ${i.unit || ''} ${i.productName}${i.details ? ` (${i.details})` : ''}`.replace(/\s+/g, ' '))
    .join('\n')}`;

function RequestDetail({ request, onClose, onStatus, navigate }) {
  const [busy, setBusy] = useState('');
  const withAsin = request.items.map((i) => ({ ...i, asin: asinFromUrl(i.supplierLink) })).filter((i) => i.asin);
  const otherLinks = request.items.filter((i) => i.supplierLink && !asinFromUrl(i.supplierLink));

  const change = async (status) => {
    setBusy(status);
    await onStatus(request, status);
    setBusy('');
  };

  return (
    <Sheet
      title={request.propertyName}
      sub={`${request.requestId} · ${request.contractorName} · ${dateTime(request.createdAt)}`}
      onClose={onClose}
      footer={(NEXT_STEPS[request.status] || []).map(([status, label, cls]) => (
        <button key={status} className={`btn ${cls}`} disabled={!!busy} onClick={() => change(status)}>
          {busy === status ? 'Saving…' : label}
        </button>
      ))}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <StatusBadge status={request.status} />
        <span className="muted small">{request.contractorEmail}</span>
      </div>

      <div className="line-items">
        {request.items.map((item) => (
          <div className="line-item" key={item.productId}>
            <div>
              {item.productName}
              <div className="sub">
                <span className="num">{item.quantity}</span> {item.unit} × <span className="num">{money(item.expectedPrice)}</span>
                {item.details ? ` · ${item.details}` : ''}
              </div>
              <ExternalLink href={item.supplierLink}>Open product page</ExternalLink>
            </div>
            <span className="num">{money(item.estimatedTotal)}</span>
          </div>
        ))}
      </div>

      <dl className="detail-grid">
        <dt>Estimated total</dt>
        <dd className="num" style={{ fontWeight: 600 }}>{money(request.estimatedTotal)}</dd>
        {request.propertyAddress && request.propertyAddress !== request.propertyName && (<><dt>Address</dt><dd>{request.propertyAddress}</dd></>)}
        {request.notes && (<><dt>Vendor notes</dt><dd>{request.notes}</dd></>)}
      </dl>

      <div className="panel panel-pad form-grid">
        <h3 style={{ fontSize: 15 }}>Order it</h3>
        {withAsin.length > 0 ? (
          <ExternalLink className="btn btn-primary" href={amazonCartUrl(withAsin)}>
            <ShoppingCartSimple size={18} /> Add {withAsin.length} item{withAsin.length > 1 ? 's' : ''} to Amazon cart
          </ExternalLink>
        ) : (
          <p className="small muted">None of these catalogue items has a specific Amazon product page yet, so there is nothing to add to the cart directly. Use the assistant to find listings.</p>
        )}
        {otherLinks.length > 0 && (
          <p className="small muted">
            {otherLinks.length} item{otherLinks.length > 1 ? 's link' : ' links'} to a search or another store; open {otherLinks.length > 1 ? 'them' : 'it'} from the list above.
          </p>
        )}
        <button className="btn" onClick={() => navigate('assistant', { draft: requestToPrompt(request) })}>
          <Robot size={18} /> Find cheaper options with the assistant
        </button>
      </div>

      {request.history?.length > 0 && (
        <ul className="timeline" aria-label="Status history">
          {request.history.map((h, i) => (
            <li key={i}><StatusBadge status={h.status} /> {dateTime(h.at)} · {h.by}</li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export default function Requests({ navigate, refreshActivity }) {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useResource('/api/requests');
  const [filter, setFilter] = useState('Submitted');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const list = useMemo(() => data || [], [data]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f, list.filter((r) => r.status === f).length])), [list]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (r) => (filter === 'All' || r.status === filter) && (!q || `${r.propertyName} ${r.contractorName} ${r.requestId} ${r.items.map((i) => i.productName).join(' ')}`.toLowerCase().includes(q))
    );
  }, [list, filter, query]);
  const open = list.find((r) => r.requestId === openId);

  const updateStatus = async (request, status) => {
    try {
      const updated = await api(`/api/requests/${encodeURIComponent(request.requestId)}/status`, { method: 'PATCH', body: { status } });
      setData((rows) => rows.map((r) => (r.requestId === updated.requestId ? updated : r)));
      toast(`${request.propertyName}: ${status.toLowerCase()}.`);
      refreshActivity();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (error) return <LoadError error={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Material requests" sub="Review what vendors asked for, approve it, then send it to the Amazon cart." />
      <div className="toolbar">
        <Segmented label="Status" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f === 'Submitted' ? 'To review' : f, count: f === 'Submitted' ? counts[f] : 0 }))} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search property, vendor or material" />
      </div>

      {loading ? (
        <Skeleton rows={6} height={56} />
      ) : shown.length === 0 ? (
        <div className="panel">
          <Empty icon={ClipboardText} title={filter === 'Submitted' ? 'Nothing waiting for review' : 'No requests here'}>
            {filter === 'Submitted' ? 'New vendor requests will show up here.' : 'Try another status or clear the search.'}
          </Empty>
        </div>
      ) : (
        <>
          <div className="panel table-wrap table-desktop">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Vendor</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="right">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.requestId} className="clickable" onClick={() => setOpenId(r.requestId)}>
                    <td>
                      <button className="text-link" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 550 }} onClick={(e) => { e.stopPropagation(); setOpenId(r.requestId); }}>
                        {r.propertyName}
                      </button>
                      <div className="cell-sub num">{r.requestId}</div>
                    </td>
                    <td>{r.contractorName}</td>
                    <td>
                      {r.items.slice(0, 2).map((i) => i.productName).join(', ')}
                      {r.items.length > 2 && <span className="muted"> +{r.items.length - 2}</span>}
                    </td>
                    <td className="muted">{date(r.createdAt)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="right num">{money(r.estimatedTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cards">
            {shown.map((r) => (
              <button key={r.requestId} className="card" onClick={() => setOpenId(r.requestId)}>
                <div className="card-top">
                  <h3>{r.propertyName}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div className="card-meta">
                  <span>{r.contractorName}</span>
                  <span>{date(r.createdAt)}</span>
                  <span>{r.items.length} items</span>
                  <span className="num">{money(r.estimatedTotal)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {open && <RequestDetail request={open} onClose={() => setOpenId(null)} onStatus={updateStatus} navigate={navigate} />}
    </>
  );
}

import { useMemo } from 'react';
import { ArrowRight, Robot } from '@phosphor-icons/react';
import { ago, date, money, moneyShort } from '../../lib/format';
import { Empty, LoadError, PageHead, Skeleton, StatusBadge, useResource } from '../../components/ui';

export default function Overview({ user, navigate, activity }) {
  const requests = useResource('/api/requests');

  const stats = useMemo(() => {
    const list = requests.data || [];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = list.filter((r) => new Date(r.createdAt) >= monthStart);
    return {
      toReview: list.filter((r) => r.status === 'Submitted'),
      toOrder: list.filter((r) => r.status === 'Approved'),
      committed: thisMonth.filter((r) => ['Approved', 'Ordered', 'Delivered'].includes(r.status)).reduce((s, r) => s + r.estimatedTotal, 0),
      monthCount: thisMonth.length
    };
  }, [requests.data]);

  if (requests.error) return <LoadError error={requests.error} onRetry={requests.reload} />;
  const counts = activity?.counts || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHead title={`${greeting}, ${user.name.split(' ')[0]}`} sub="What needs a decision today, and what is ready to order.">
        <button className="btn btn-primary" onClick={() => navigate('assistant')}><Robot size={18} /> Paste a WhatsApp list</button>
      </PageHead>

      {requests.loading ? (
        <Skeleton rows={4} height={72} />
      ) : (
        <>
          <section className="stats" aria-label="Summary">
            <button className={`stat ${stats.toReview.length ? 'attention' : ''}`} onClick={() => navigate('requests')}>
              <span>Requests to review</span>
              <strong className="num">{stats.toReview.length}</strong>
              <small>{money(stats.toReview.reduce((s, r) => s + r.estimatedTotal, 0))} waiting</small>
            </button>
            <button className={`stat ${stats.toOrder.length ? 'attention' : ''}`} onClick={() => navigate('requests')}>
              <span>Approved, not ordered</span>
              <strong className="num">{stats.toOrder.length}</strong>
              <small>Ready for the Amazon cart</small>
            </button>
            <button className={`stat ${counts.suggestions ? 'attention' : ''}`} onClick={() => navigate('suggestions')}>
              <span>Vendor suggestions</span>
              <strong className="num">{counts.suggestions ?? '–'}</strong>
              <small>{counts.signups ? `${counts.signups} sign-up${counts.signups > 1 ? 's' : ''} to approve` : 'New items and better prices'}</small>
            </button>
            <div className="stat">
              <span>Committed this month</span>
              <strong className="num">{moneyShort(stats.committed)}</strong>
              <small>{stats.monthCount} request{stats.monthCount === 1 ? '' : 's'} this month</small>
            </div>
          </section>

          <div className="overview-grid">
            <section className="panel">
              <div className="panel-head">
                <h2>Latest requests</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('requests')}>All requests <ArrowRight size={14} /></button>
              </div>
              {requests.data.length === 0 ? (
                <Empty title="No requests yet">Vendors' material requests will appear here as soon as they send one.</Empty>
              ) : (
                <ul className="list">
                  {requests.data.slice(0, 8).map((r) => (
                    <li key={r.requestId}>
                      <button className="list-row" onClick={() => navigate('requests')}>
                        <span className="grow">
                          <span className="title">{r.propertyName}</span>
                          <span className="sub">{r.contractorName} · {date(r.createdAt)} · {r.items.length} items</span>
                        </span>
                        <span className="end">
                          <span className="num">{money(r.estimatedTotal)}</span>
                          <StatusBadge status={r.status} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Activity</h2></div>
              {!activity ? (
                <div style={{ padding: 20 }}><Skeleton rows={4} height={36} /></div>
              ) : activity.events.length === 0 ? (
                <p className="muted small" style={{ padding: '0 20px 20px' }}>Nothing yet.</p>
              ) : (
                <ul className="list">
                  {activity.events.map((e) => (
                    <li key={`${e.type}-${e.id}`}>
                      <button className="list-row" onClick={() => navigate(e.type === 'request' ? 'requests' : 'suggestions')}>
                        <span className="grow">
                          <span className="title" style={{ whiteSpace: 'normal', fontWeight: 500 }}>{e.title}</span>
                          <span className="sub">{ago(e.at)}</span>
                        </span>
                        <StatusBadge status={e.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

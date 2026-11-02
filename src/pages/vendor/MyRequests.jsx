import { useState } from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { date, dateTime, money } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { Empty, LoadError, PageHead, Sheet, Skeleton, StatusBadge, useResource } from '../../components/ui';
import { PendingApproval } from './OrderMaterials';

export default function MyRequests({ user, navigate }) {
  const { t, statusText } = useI18n();
  const { data, error, loading, reload } = useResource(user.approved ? '/api/requests' : null);
  const [open, setOpen] = useState(null);

  if (!user.approved) return <PendingApproval />;
  if (error) return <LoadError error={error} onRetry={reload} />;

  return (
    <>
      <PageHead title={t('myRequests')}>
        <button className="btn btn-primary" onClick={() => navigate('order')}>{t('newRequest')}</button>
      </PageHead>
      {loading ? (
        <Skeleton rows={5} height={64} />
      ) : data.length === 0 ? (
        <div className="panel">
          <Empty icon={ClipboardText} title={t('noRequests')}>{t('noRequestsBody')}</Empty>
        </div>
      ) : (
        <div className="panel">
          <ul className="list">
            {data.map((r, i) => (
              <li key={r.requestId} style={i === 0 ? { borderTop: 0 } : undefined}>
                <button className="list-row" onClick={() => setOpen(r)}>
                  <span className="grow">
                    <span className="title">{r.propertyName}</span>
                    <span className="sub">{date(r.createdAt)} · {r.items.length} {t('items')}</span>
                  </span>
                  <span className="end">
                    <span className="num">{money(r.estimatedTotal)}</span>
                    <StatusBadge status={r.status} label={statusText(r.status)} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <Sheet title={open.propertyName} sub={`${open.requestId} · ${dateTime(open.createdAt)}`} onClose={() => setOpen(null)}>
          <div><StatusBadge status={open.status} label={statusText(open.status)} /></div>
          <div className="line-items">
            {open.items.map((item) => (
              <div className="line-item" key={item.productId}>
                <div>
                  {item.productName}
                  <div className="sub"><span className="num">{item.quantity}</span> {item.unit} × <span className="num">{money(item.expectedPrice)}</span></div>
                </div>
                <span className="num">{money(item.estimatedTotal)}</span>
              </div>
            ))}
          </div>
          <dl className="detail-grid">
            <dt>{t('total')}</dt>
            <dd className="num">{money(open.estimatedTotal)}</dd>
            {open.notes && (<><dt>{t('notes')}</dt><dd>{open.notes}</dd></>)}
          </dl>
          {open.history?.length > 0 && (
            <ul className="timeline">
              {open.history.map((h, i) => (
                <li key={i}><StatusBadge status={h.status} label={statusText(h.status)} /> {dateTime(h.at)}</li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
    </>
  );
}

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ArrowRight, ShieldCheck, DollarSign, Package } from 'lucide-react';

export default function RequestFeed({ requests, activeRole, onAgencyAction }) {
  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-cream-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <Package size={48} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--violet-deep)' }}>No Material Requests Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Constructor requests for wood, materials, and monies will appear here.</p>
      </div>
    );
  }

  return (
    <div className="requests-list">
      {requests.map(req => {
        const isPending = req.status === 'Pending Agency Action';
        const isApproved = req.status === 'Approved & Dispatched';
        const isUrgent = req.urgency?.includes('High') || req.urgency?.includes('Critical');

        return (
          <div 
            key={req.requestId} 
            className={`request-card ${isUrgent ? 'urgent' : ''} ${isApproved ? 'resolved' : ''}`}
          >
            <div className="request-header">
              <div className="request-title-area">
                <h3>{req.listingTitle}</h3>
                <div className="request-subtitle">
                  <span>Req ID: <strong>{req.requestId}</strong></span>
                  <span>•</span>
                  <span>Contractor: <strong>{req.contractorName}</strong></span>
                  <span>•</span>
                  <span>Submitted: {req.submittedAt}</span>
                </div>
              </div>

              <div>
                {isPending && (
                  <span className="status-badge pending">
                    <Clock size={13} /> Pending Agency Action
                  </span>
                )}
                {isApproved && (
                  <span className="status-badge approved">
                    <CheckCircle2 size={13} /> Approved & Dispatched
                  </span>
                )}
                {req.status === 'Under Agency Inspection' && (
                  <span className="status-badge dispatched">
                    <ShieldCheck size={13} /> Site Audit Scheduled
                  </span>
                )}
                {req.status === 'Declined' && (
                  <span className="status-badge rejected">
                    Declined
                  </span>
                )}
              </div>
            </div>

            <div className="request-body">
              <div className="request-message">
                "{req.message}"
              </div>
              <div className="request-amount-box">
                <div className="amount-chip">
                  Materials: {req.materialRequested}
                </div>
                <div className="amount-chip">
                  Required Monies: ${req.amountRequested.toLocaleString()}
                </div>
                <div className="amount-chip" style={{ background: isUrgent ? 'var(--bg-baby-pink-soft)' : 'transparent' }}>
                  Urgency: {req.urgency}
                </div>
              </div>
            </div>

            {/* Agency Follow-Through Response Section */}
            {req.agencyResponse ? (
              <div className="agency-response-box">
                <h4>
                  <ShieldCheck size={15} color="var(--violet-primary)" />
                  Agency Action & Follow-Through Resolution ({req.agencyResponse.dispatchedAt})
                </h4>
                <p>{req.agencyResponse.note}</p>
                {req.agencyResponse.dispatchedAmount > 0 && (
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--violet-dark)', fontSize: '0.9rem' }}>
                    ✔ Wire Transfer Dispatched: ${req.agencyResponse.dispatchedAmount.toLocaleString()} USD
                  </div>
                )}
              </div>
            ) : (
              activeRole === 'agency' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => onAgencyAction(req)}
                  >
                    <ShieldCheck size={16} />
                    Follow Through & Action Request
                  </button>
                </div>
              )
            )}

            {/* Action Timeline */}
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1.5rem', fontSize: '0.775rem', color: 'var(--text-light)', flexWrap: 'wrap' }}>
              {req.actionTimeline?.map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ArrowRight size={12} color="var(--pink-accent)" />
                  <strong>{t.actor}:</strong> {t.step} ({t.timestamp})
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

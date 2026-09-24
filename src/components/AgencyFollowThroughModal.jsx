import React, { useState } from 'react';
import { X, CheckCircle, Clock, XCircle, DollarSign, ShieldCheck } from 'lucide-react';

export default function AgencyFollowThroughModal({ request, onClose, onProcess }) {
  const [decision, setDecision] = useState('approve');
  const [approvedAmount, setApprovedAmount] = useState(request.amountRequested || 18500);
  const [note, setNote] = useState(
    `Agency has verified the 500 wood shortage for property listing 1 (${request.listingTitle}). Monies totaling $${request.amountRequested.toLocaleString()} have been authorized and dispatched for immediate procurement.`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onProcess(request.requestId, decision, note, Number(approvedAmount));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Agency Request Follow-Through</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Review & Authorize Contractor Request #{request.requestId}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'var(--bg-baby-pink)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-pink)' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--pink-accent)', fontWeight: 700, marginBottom: '0.25rem' }}>
            Constructor Submitted Request:
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--violet-deep)', marginBottom: '0.5rem' }}>
            "{request.message}"
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span><strong>Target:</strong> {request.listingTitle}</span>
            <span><strong>Materials:</strong> {request.materialRequested}</span>
            <span><strong>Requested Monies:</strong> ${request.amountRequested.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Agency Follow-Through Decision</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <button 
                type="button" 
                className={`btn ${decision === 'approve' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setDecision('approve');
                  setNote(`Agency has verified the 500 wood shortage for property listing 1. Monies totaling $${approvedAmount.toLocaleString()} have been authorized and dispatched.`);
                }}
                style={{ fontSize: '0.85rem' }}
              >
                <CheckCircle size={15} /> Approve & Fund
              </button>

              <button 
                type="button" 
                className={`btn ${decision === 'in_review' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setDecision('in_review');
                  setNote("Agency auditor has scheduled an on-site wood inventory check before dispatching funds.");
                }}
                style={{ fontSize: '0.85rem' }}
              >
                <Clock size={15} /> Site Audit
              </button>

              <button 
                type="button" 
                className={`btn ${decision === 'decline' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setDecision('decline');
                  setNote("Request declined pending clarification on existing timber budget allocation.");
                }}
                style={{ fontSize: '0.85rem' }}
              >
                <XCircle size={15} /> Decline
              </button>
            </div>
          </div>

          {decision === 'approve' && (
            <div className="form-group">
              <label>Authorized Disbursement Monies ($ USD)</label>
              <input 
                type="number" 
                className="form-control" 
                value={approvedAmount} 
                onChange={e => setApprovedAmount(e.target.value)} 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label>Official Agency Dispatch Note / Instructions</label>
            <textarea 
              className="form-control" 
              rows={4} 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <ShieldCheck size={16} />
              Confirm Follow-Through & Update Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

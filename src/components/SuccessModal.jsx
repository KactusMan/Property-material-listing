import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function SuccessModal({ requestId, onClose }) {
  if (!requestId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🎉</div>
        <h2 className="modal-title">Request Submitted!</h2>
        <div className="modal-body">
          <p style={{ marginBottom: '12px' }}>
            Your material request has been securely recorded in the <strong>MongoDB Database</strong>.
          </p>
          <div style={{
            background: 'var(--pink-light)',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-pink)',
            fontWeight: '800',
            color: 'var(--pink-dark)',
            fontSize: '1.2rem',
            letterSpacing: '0.5px',
            display: 'inline-block'
          }}>
            {requestId}
          </div>
          <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            The purchaser & admin team will review your order details shortly.
          </p>
        </div>
        <button
          className="btn-submit"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          <CheckCircle2 size={20} /> Done
        </button>
      </div>
    </div>
  );
}

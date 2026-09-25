import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function SuccessModal({ requestId, onClose }) {
  if (!requestId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center', padding: '32px 24px' }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <CheckCircle2 size={32} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
          Request Submitted Successfully!
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
          Your material request has been logged and sent to the administrator & purchasing team for review.
        </p>

        <div style={{
          background: 'var(--primary-blue-light)',
          padding: '10px 18px',
          borderRadius: '12px',
          border: '1px solid var(--primary-blue-border)',
          fontWeight: '800',
          color: 'var(--primary-blue)',
          fontSize: '1.1rem',
          fontFamily: 'var(--font-mono)',
          margin: '0 auto 20px auto',
          display: 'inline-block'
        }}>
          {requestId}
        </div>

        <button
          className="btn-auth-submit"
          style={{ width: '100%', margin: 0, padding: '14px' }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}

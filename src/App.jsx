import React, { useState } from 'react';
import VendorForm from './components/VendorForm';
import AdminDashboard from './components/AdminDashboard';
import SuccessModal from './components/SuccessModal';
import { Home, ShieldCheck, Sparkles, Database } from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('vendor'); // 'vendor' | 'admin'
  const [submittedRequestId, setSubmittedRequestId] = useState(null);

  const handleRequestSuccess = (requestId) => {
    setSubmittedRequestId(requestId);
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="app-title-group">
          <h1>
            <span role="img" aria-label="house">🏠</span> Property Materials
          </h1>
          <p>
            Real-Estate Vendor Order System &nbsp;|&nbsp;
            <span style={{ color: 'var(--pink-primary)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Database size={14} /> Connected to MongoDB Atlas
            </span>
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${activeMode === 'vendor' ? 'active' : ''}`}
            onClick={() => setActiveMode('vendor')}
          >
            🌸 Vendor Request
          </button>
          <button
            className={`mode-btn ${activeMode === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveMode('admin')}
          >
            👑 Purchaser / Admin
          </button>
        </div>
      </header>

      {/* Main Mode Views */}
      <main>
        {activeMode === 'vendor' ? (
          <VendorForm onSuccess={handleRequestSuccess} />
        ) : (
          <AdminDashboard />
        )}
      </main>

      {/* Submission Success Pop-up Modal */}
      <SuccessModal
        requestId={submittedRequestId}
        onClose={() => setSubmittedRequestId(null)}
      />
    </div>
  );
}

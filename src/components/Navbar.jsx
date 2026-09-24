import React from 'react';
import { Building2, UserCheck, HardHat, RefreshCw } from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, resetDemoData }) {
  return (
    <header className="navbar">
      <div className="brand-logo">
        <div className="brand-icon">
          <Building2 size={24} />
        </div>
        <div className="brand-text">
          <h1>AURA LUXE</h1>
          <p>ESTATE & CONSTRUCTION PORTAL</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="role-switcher">
          <button 
            className={`role-btn ${activeRole === 'agency' ? 'active' : ''}`}
            onClick={() => setActiveRole('agency')}
            title="Owner & Real Estate Agency Portal"
          >
            <UserCheck size={16} />
            <span>Owner / Agency</span>
            {activeRole === 'agency' && <span className="role-badge">Active</span>}
          </button>

          <button 
            className={`role-btn ${activeRole === 'constructor' ? 'active' : ''}`}
            onClick={() => setActiveRole('constructor')}
            title="Constructor & Field Builder Portal"
          >
            <HardHat size={16} />
            <span>Constructor Co.</span>
            {activeRole === 'constructor' && <span className="role-badge">Active</span>}
          </button>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={resetDemoData} 
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
          title="Reset to default Houston & Arizona demo data"
        >
          <RefreshCw size={14} />
          Reset Demo
        </button>
      </div>
    </header>
  );
}

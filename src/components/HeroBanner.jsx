import React from 'react';
import { DollarSign, Building, AlertCircle, ShieldCheck } from 'lucide-react';

export default function HeroBanner({ listings, requests, activeRole, onOpenNewRequest }) {
  const pendingRequests = requests.filter(r => r.status === 'Pending Agency Action');
  const approvedRequests = requests.filter(r => r.status === 'Approved & Dispatched');
  
  const totalApprovedAmount = approvedRequests.reduce((acc, r) => {
    return acc + (r.agencyResponse?.dispatchedAmount || r.amountRequested || 0);
  }, 0);

  return (
    <div className="hero-banner">
      <div className="hero-tag">
        <ShieldCheck size={14} />
        {activeRole === 'agency' ? 'Real Estate Owner & Agency Portal' : 'Constructor & Site Operations'}
      </div>
      
      <h2 className="hero-title">
        {activeRole === 'agency' 
          ? 'Portfolio Listings & Contractor Monies Management' 
          : 'Construction Field Requests & Materials Dispatch'}
      </h2>
      
      <p className="hero-subtitle">
        {activeRole === 'agency'
          ? 'Upload, track luxury property listings (Houston & Arizona), and seamlessly follow through on constructor material and funding requests.'
          : 'Log construction updates, submit wood/lumber shortages, and request project funding directly from the agency.'}
      </p>

      {activeRole === 'constructor' && (
        <button 
          className="btn btn-accent" 
          onClick={onOpenNewRequest} 
          style={{ marginBottom: '1.5rem', padding: '0.85rem 1.75rem', fontSize: '1rem' }}
        >
          <AlertCircle size={18} />
          Submit Woods & Monies Request
        </button>
      )}

      <div className="hero-stats">
        <div className="stat-item">
          <h3>{listings.length}</h3>
          <p>Active Listings</p>
        </div>
        <div className="stat-item">
          <h3 style={{ color: pendingRequests.length > 0 ? '#F8E1EB' : '#FFFDF9' }}>
            {pendingRequests.length}
          </h3>
          <p>Pending Requests</p>
        </div>
        <div className="stat-item">
          <h3>${totalApprovedAmount.toLocaleString()}</h3>
          <p>Dispatched Monies</p>
        </div>
        <div className="stat-item">
          <h3>100%</h3>
          <p>Agency Follow-Through Rate</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { MapPin, Bed, Bath, Maximize, Hammer, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ListingCard({ listing, activeRole, onRequestMaterials, pendingRequestsCount }) {
  return (
    <div className="listing-card">
      <div className="listing-image-wrapper">
        <img src={listing.image} alt={listing.title} className="listing-image" />
        <div className="listing-badge">
          <Hammer size={12} />
          {listing.status}
        </div>
        <div className="listing-id-tag">
          Ref #{listing.id}
        </div>
      </div>

      <div className="listing-content">
        <h3 className="listing-title">{listing.title}</h3>
        <div className="listing-location">
          <MapPin size={15} color="var(--pink-accent)" />
          <span>{listing.location}</span>
        </div>

        <div className="listing-meta-grid">
          <div className="meta-item">
            <span>Listing Price</span>
            <strong>{listing.price}</strong>
          </div>
          <div className="meta-item">
            <span>Budget Spent</span>
            <strong style={{ color: 'var(--violet-accent)' }}>{listing.budgetSpent}</strong>
          </div>
          <div className="meta-item">
            <span>Contractor</span>
            <strong style={{ fontSize: '0.8rem' }}>{listing.contractor.split(' ')[0]}</strong>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>Construction Completion</span>
            <span>{listing.progressPct}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${listing.progressPct}%` }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Bed size={14}/> {listing.specs.beds} Beds</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Bath size={14}/> {listing.specs.baths} Baths</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Maximize size={14}/> {listing.specs.sqft}</span>
        </div>

        <div className="card-actions">
          {activeRole === 'constructor' ? (
            <button 
              className="btn btn-accent btn-full"
              onClick={() => onRequestMaterials(listing.id)}
            >
              <AlertTriangle size={15} />
              Request Woods & Funds
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-full"
              onClick={() => onRequestMaterials(listing.id)}
            >
              <CheckCircle2 size={15} />
              {pendingRequestsCount > 0 
                ? `Review ${pendingRequestsCount} Pending Request(s)` 
                : 'View Construction Log'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

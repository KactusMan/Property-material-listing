import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, CheckCircle, Package } from 'lucide-react';
import { apiFetch } from '../lib/api';

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80'
];

export default function PropertyCatalog({ onSelectPropertyForOrder }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
        Loading active properties…
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Active Development Properties ({properties.length})
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Select a property to initiate a material request or monitor active job sites.
          </p>
        </div>
      </div>

      <div className="properties-grid">
        {properties.map((prop, idx) => {
          const imgUrl = PROPERTY_IMAGES[idx % PROPERTY_IMAGES.length];
          return (
            <div key={prop.id} className="property-card-pro">
              <img src={imgUrl} alt={prop.name} className="property-image-box" />

              <div className="property-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="spec-pill" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)', border: 'none' }}>
                    {prop.id}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Active Job
                  </span>
                </div>

                <div className="property-title">{prop.name}</div>
                <div className="property-address">
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {prop.address}
                </div>


                <button
                  className="btn-auth-submit"
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => onSelectPropertyForOrder(prop.name)}
                >
                  <Package size={16} /> Request Materials
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

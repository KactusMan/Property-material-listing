import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Truck, 
  PackageCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) throw new Error('Could not fetch requests from MongoDB API.');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status.');
      
      // Update local state
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Re-seed MongoDB with default 59 products & 19 properties?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchRequests();
    } catch (err) {
      alert('Error seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Metrics Calculations
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Submitted').length;
  const totalMonies = requests.reduce((sum, r) => sum + (r.estimatedTotal || 0), 0);

  const filteredRequests = requests.filter(r => filterStatus === 'All' || r.status === filterStatus);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--pink-dark)' }}>
          👑 Loading Admin Dashboard & MongoDB Requests...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Controls & Reseed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--pink-dark)' }}>
            Purchaser & Admin Monies Portal
          </h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '0.95rem' }}>
            Review vendor material requests, check price calculations, and manage order statuses in MongoDB.
          </p>
        </div>

        <button
          onClick={handleReseed}
          disabled={seeding}
          className="cat-pill"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white' }}
        >
          <RefreshCw size={16} className={seeding ? 'spin' : ''} />
          {seeding ? 'Seeding MongoDB...' : 'Reset & Seed MongoDB'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Material Requests</div>
          <div className="metric-value">{totalRequests}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Pending Review</div>
          <div className="metric-value" style={{ color: '#e65100' }}>{pendingCount}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Estimated Total Monies</div>
          <div className="metric-value" style={{ color: 'var(--pink-primary)' }}>
            ${totalMonies.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="category-pills" style={{ marginBottom: '20px' }}>
        {['All', 'Submitted', 'Approved', 'Ordered', 'Delivered', 'Cancelled'].map(status => (
          <button
            key={status}
            className={`cat-pill ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No material requests found for status: <strong>{filterStatus}</strong>
        </div>
      ) : (
        filteredRequests.map(req => {
          const isExpanded = expandedRequestId === req.requestId;
          const statusClass = `badge-${req.status.toLowerCase()}`;

          return (
            <div key={req.requestId} className="request-card">
              <div className="request-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--pink-dark)' }}>
                      {req.requestId}
                    </span>
                    <span className={`badge-status ${statusClass}`}>
                      {req.status}
                    </span>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={16} color="var(--pink-primary)" />
                      <strong>Vendor:</strong> {req.contractorName}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={16} color="var(--pink-primary)" />
                      <strong>Property:</strong> {req.propertyName} ({req.propertyAddress})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--pink-primary)' }}>
                    ${(req.estimatedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Status Update Quick Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {req.status === 'Submitted' && (
                    <button
                      onClick={() => handleStatusUpdate(req.requestId, 'Approved')}
                      style={{ background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', padding: '6px 14px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {req.status === 'Approved' && (
                    <button
                      onClick={() => handleStatusUpdate(req.requestId, 'Ordered')}
                      style={{ background: '#f3e5f5', color: '#7b1fa2', border: '1px solid #ce93d8', padding: '6px 14px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      📦 Mark Ordered
                    </button>
                  )}
                  {req.status === 'Ordered' && (
                    <button
                      onClick={() => handleStatusUpdate(req.requestId, 'Delivered')}
                      style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', padding: '6px 14px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🚚 Mark Delivered
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.requestId)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--pink-primary)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {isExpanded ? 'Hide Details' : 'View Items'}
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Expanded Items & Notes */}
              {isExpanded && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1.5px dashed var(--border-pink)' }}>
                  {req.notes && (
                    <div style={{ background: 'var(--pink-light)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                      <strong>Vendor Notes:</strong> {req.notes}
                    </div>
                  )}

                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--pink-dark)', marginBottom: '8px' }}>
                    Requested Items Breakdown:
                  </h4>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--pink-subtle)', textAlign: 'left', color: 'var(--pink-dark)' }}>
                        <th style={{ padding: '8px 12px' }}>Product</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Expected Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Estimated Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{item.productName}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-medium)' }}>
                            ${item.expectedPrice.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--pink-primary)' }}>
                            ${item.estimatedTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

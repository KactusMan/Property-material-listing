import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  User, 
  TrendingUp, 
  FileText,
  AlertCircle
} from 'lucide-react';
import PropertyCatalog from './PropertyCatalog';

export default function AdminDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReqId, setExpandedReqId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [adminTab, setAdminTab] = useState('overview'); // 'overview' | 'requests' | 'properties'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resReq, resCont] = await Promise.all([
        fetch('/api/requests', {
          headers: {
            'x-user-role': user.role,
            'x-user-email': user.email
          }
        }),
        fetch('/api/contractors')
      ]);

      const dataReq = await resReq.json();
      const dataCont = await resCont.json();

      setRequests(dataReq);
      setContractors(dataCont);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status.');
      
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  // Metrics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Submitted');
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const totalMonies = requests.reduce((sum, r) => sum + (r.estimatedTotal || 0), 0);

  const filteredRequests = requests.filter(r => filterStatus === 'All' || r.status === filterStatus);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
        Loading Admin Control Center & MongoDB Data...
      </div>
    );
  }

  return (
    <div>
      {/* Metrics Row Matching Screenshot 1 */}
      <div className="metrics-grid">
        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Total Monies Allocated</span>
            <span className="trend-badge trend-up">↑ 4.2%</span>
          </div>
          <div className="metric-number" style={{ color: 'var(--primary-blue)' }}>
            ${totalMonies.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Pending Admin Review</span>
            <span className="trend-badge trend-down">Pending</span>
          </div>
          <div className="metric-number" style={{ color: '#d97706' }}>
            {pendingRequests.length}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Approved Orders</span>
            <span className="trend-badge trend-up">✓ Confirmed</span>
          </div>
          <div className="metric-number" style={{ color: '#2e7d32' }}>
            {approvedRequests.length}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Active Contractors</span>
            <span className="trend-badge trend-up">47 Active</span>
          </div>
          <div className="metric-number">
            {contractors.length}
          </div>
        </div>
      </div>

      {/* Internal Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`role-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setAdminTab('overview')}
        >
          📊 Dashboard Analytics
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'requests' ? 'active' : ''}`}
          onClick={() => setAdminTab('requests')}
        >
          📋 Material Approvals ({requests.length})
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'properties' ? 'active' : ''}`}
          onClick={() => setAdminTab('properties')}
        >
          🏙️ Property Directory (19)
        </button>
      </div>

      {/* Overview Analytics View matching Screenshot 1 */}
      {adminTab === 'overview' && (
        <div>
          <div className="analytics-grid">
            {/* Bar Chart Section */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h4 className="chart-title">Material Requests vs Approvals</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monthly distribution across 19 active property sites</p>
                </div>
                <span className="spec-pill" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>Monthly</span>
              </div>

              <div className="chart-bars">
                {[
                  { month: 'Jan', val: 40 },
                  { month: 'Feb', val: 65 },
                  { month: 'Mar', val: 80 },
                  { month: 'Apr', val: 95 },
                  { month: 'May', val: 70 },
                  { month: 'Jun', val: 85 },
                  { month: 'Jul', val: 75 }
                ].map((bar, idx) => (
                  <div key={idx} className="bar-col">
                    <div className="bar-fill" style={{ height: `${bar.val}%` }} />
                    <span className="bar-label">{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown Circle Card */}
            <div className="chart-card">
              <div className="chart-header">
                <h4 className="chart-title">Status Breakdown</h4>
              </div>

              <div style={{ padding: '10px 0' }}>
                {[
                  { label: 'Submitted (Pending)', count: pendingRequests.length, color: '#d97706' },
                  { label: 'Approved', count: approvedRequests.length, color: 'var(--primary-blue)' },
                  { label: 'Ordered', count: requests.filter(r => r.status === 'Ordered').length, color: '#7e22ce' },
                  { label: 'Delivered', count: requests.filter(r => r.status === 'Delivered').length, color: '#15803d' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <span className="mono-text" style={{ fontWeight: '800', fontSize: '1.1rem' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Recent Requests Section */}
          <h3 className="chart-title" style={{ marginBottom: '16px' }}>
            Recent Material Requests Requiring Action
          </h3>
        </div>
      )}

      {/* Requests Approvals View */}
      {(adminTab === 'overview' || adminTab === 'requests') && (
        <div>
          {/* Status Filters */}
          <div className="category-pills" style={{ marginBottom: '20px' }}>
            {['All', 'Submitted', 'Approved', 'Ordered', 'Delivered'].map(st => (
              <button
                key={st}
                className={`cat-pill ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="chart-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No requests found under status: <strong>{filterStatus}</strong>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isExpanded = expandedReqId === req.requestId;
              return (
                <div key={req.requestId} className="chart-card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="mono-text" style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-blue)' }}>
                          {req.requestId}
                        </span>
                        <span className={`status-pill status-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>👤 Vendor: <strong>{req.contractorName}</strong></span>
                        <span>🏙️ Property: <strong>{req.propertyName}</strong> ({req.propertyAddress})</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono-text" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                        ${(req.estimatedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Logged: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expansion */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {req.status === 'Submitted' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Approved')}
                          style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          ✓ Approve Request
                        </button>
                      )}

                      {req.status === 'Approved' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Ordered')}
                          style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          📦 Mark as Ordered
                        </button>
                      )}

                      {req.status === 'Ordered' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Delivered')}
                          style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          🚚 Mark Delivered
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedReqId(isExpanded ? null : req.requestId)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary-blue)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isExpanded ? 'Hide Items' : 'View Line Items'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Line Items Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                      {req.notes && (
                        <div style={{ background: 'var(--bg-slate)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '12px' }}>
                          <strong>Notes:</strong> {req.notes}
                        </div>
                      )}

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px' }}>Material Item</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quantity</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Expected Unit Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Estimated Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '600' }}>{item.productName}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800' }}>{item.quantity}</td>
                              <td className="mono-text" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                ${item.expectedPrice.toFixed(2)}
                              </td>
                              <td className="mono-text" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--primary-blue)' }}>
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
      )}

      {/* Properties Tab */}
      {adminTab === 'properties' && (
        <PropertyCatalog onSelectPropertyForOrder={() => setAdminTab('requests')} />
      )}
    </div>
  );
}

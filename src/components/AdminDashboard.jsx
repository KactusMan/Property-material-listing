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
  ExternalLink,
  Plus,
  Edit2,
  Check,
  X,
  Building,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useI18n } from '../lib/i18n';

export default function AdminDashboard({ user, activeTab }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [products, setProducts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedReqId, setExpandedReqId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Sync adminTab with activeTab passed from Sidebar
  const getAdminTabFromProp = (tab) => {
    if (tab === 'requests') return 'requests';
    if (tab === 'contractors') return 'contractors';
    if (tab === 'products') return 'products';
    if (tab === 'properties') return 'properties';
    return 'overview';
  };

  const [adminTab, setAdminTab] = useState(getAdminTabFromProp(activeTab));

  useEffect(() => {
    setAdminTab(getAdminTabFromProp(activeTab));
  }, [activeTab]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resReq, resCont, resProd, resProp] = await Promise.all([
        apiFetch('/api/requests'),
        apiFetch('/api/contractors'),
        apiFetch('/api/products'),
        apiFetch('/api/properties')
      ]);

      if (!resReq.ok || !resCont.ok || !resProd.ok || !resProp.ok) {
        throw new Error('Could not load administrator data.');
      }

      const dataReq = await resReq.json();
      const dataCont = await resCont.json();
      const dataProd = await resProd.json();
      const dataProp = await resProp.json();

      setRequests(dataReq);
      setContractors(dataCont);
      setProducts(dataProd);
      setProperties(dataProp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const res = await apiFetch(`/api/requests/${requestId}/status`, {
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

  const handleOpenAllLinks = (items) => {
    const validLinks = items.map(i => i.supplierLink).filter(Boolean);
    if (validLinks.length === 0) {
      alert('No supplier links saved for the items in this request yet. You can add links in the Master Products Catalog.');
      return;
    }
    validLinks.forEach(url => {
      window.open(url, '_blank');
    });
  };

  // Product CRUD
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: '', category: 'General', unit: 'each', details: '', supplierLink: '', expectedPrice: '', image: '', notes: ''
  });

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propForm, setPropForm] = useState({ name: '', address: '' });

  const [editingContractor, setEditingContractor] = useState(null);
  const [selectedPropsToAssign, setSelectedPropsToAssign] = useState([]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct.productId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodForm)
      });

      if (!res.ok) throw new Error('Failed to save product');

      setShowProductModal(false);
      setEditingProduct(null);
      setProdForm({ name: '', category: 'General', unit: 'each', details: '', supplierLink: '', expectedPrice: '', image: '', notes: '' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleProduct = async (productId) => {
    try {
      const res = await apiFetch(`/api/products/${productId}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle status');
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propForm)
      });
      if (!res.ok) throw new Error('Failed to add property');

      setShowPropertyModal(false);
      setPropForm({ name: '', address: '' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveContractorProps = async () => {
    if (!editingContractor) return;
    try {
      const res = await apiFetch(`/api/contractors/${editingContractor.contractorId}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedProperties: selectedPropsToAssign })
      });

      if (!res.ok) throw new Error('Failed to assign properties');

      setEditingContractor(null);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Metrics
  const pendingRequests = requests.filter(r => r.status === 'Submitted');
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const totalMonies = requests.reduce((sum, r) => sum + (r.estimatedTotal || 0), 0);

  const filteredRequests = requests.filter(r => filterStatus === 'All' || r.status === filterStatus);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
        Loading Admin Control Center & Database Data...
      </div>
    );
  }

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Total Material Estimated Cost</span>
          </div>
          <div className="metric-number" style={{ color: 'var(--primary-blue)' }}>
            ${totalMonies.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">{t('pendingReview')}</span>
          </div>
          <div className="metric-number" style={{ color: '#d97706' }}>
            {pendingRequests.length}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">{t('approvedOrders')}</span>
          </div>
          <div className="metric-number" style={{ color: '#2e7d32' }}>
            {approvedRequests.length}
          </div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">{t('activeContractors')}</span>
          </div>
          <div className="metric-number">
            {contractors.length}
          </div>
        </div>
      </div>

      {/* Internal Sub-Tabs Navigation */}
      <div className="admin-nav-tabs">
        <button
          className={`role-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setAdminTab('overview')}
        >
          {t('overviewTab')}
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'requests' ? 'active' : ''}`}
          onClick={() => setAdminTab('requests')}
        >
          {t('materialApprovals')} ({requests.length})
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'contractors' ? 'active' : ''}`}
          onClick={() => setAdminTab('contractors')}
        >
          {t('contractorAssignments')} ({contractors.length})
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'products' ? 'active' : ''}`}
          onClick={() => setAdminTab('products')}
        >
          {t('masterProductCatalog')} ({products.length})
        </button>

        <button
          className={`role-tab-btn ${adminTab === 'properties' ? 'active' : ''}`}
          onClick={() => setAdminTab('properties')}
        >
          {t('properties')} ({properties.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {adminTab === 'overview' && (
        <div>
          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h4 className="chart-title">Material Requests & Approvals Workflow</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time material request activity overview</p>
                </div>
                <span className="spec-pill" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>Live Activity</span>
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
        </div>
      )}

      {/* TAB 2: REQUESTS APPROVALS FEED */}
      {(adminTab === 'overview' || adminTab === 'requests') && (
        <div>
          <div className="category-pills" style={{ marginBottom: '20px' }}>
            {['All', 'Submitted', 'Approved', 'Ordered', 'Delivered'].map(st => (
              <button
                key={st}
                className={`cat-pill ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'All' ? t('allCategories') : t(st.toLowerCase()) || st}
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
                          {t(req.status.toLowerCase()) || req.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>Contractor: <strong>{req.contractorName}</strong> ({req.contractorEmail})</span>
                        <span>Property: <strong>{req.propertyName}</strong> {req.propertyAddress && `(${req.propertyAddress})`}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono-text" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                        ${(req.estimatedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {req.status === 'Submitted' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Approved')}
                          className="action-btn btn-approve"
                        >
                          {t('approveRequest')}
                        </button>
                      )}

                      {req.status === 'Approved' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Ordered')}
                          className="action-btn btn-order"
                        >
                          {t('markOrdered')}
                        </button>
                      )}

                      {req.status === 'Ordered' && (
                        <button
                          onClick={() => handleStatusUpdate(req.requestId, 'Delivered')}
                          className="action-btn btn-deliver"
                        >
                          {t('markDelivered')}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenAllLinks(req.items)}
                        className="action-btn btn-amazon"
                      >
                        <ShoppingBag size={15} />
                        {t('openAllSupplierLinks')}
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedReqId(isExpanded ? null : req.requestId)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary-blue)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isExpanded ? t('hideItems') : t('viewLineItems')}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Line Items Expansion */}
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
                            <th style={{ padding: '8px 12px' }}>Material Item & Details</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('expectedUnitPrice')}</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('estimatedLineTotal')}</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Supplier Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                                <div>{item.productName}</div>
                                {item.details && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.details}</div>}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800' }}>{item.quantity}</td>
                              <td className="mono-text" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                ${item.expectedPrice.toFixed(2)}
                              </td>
                              <td className="mono-text" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--primary-blue)' }}>
                                ${item.estimatedTotal.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                {item.supplierLink ? (
                                  <a
                                    href={item.supplierLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="supplier-link-btn"
                                  >
                                    Amazon / Link <ExternalLink size={13} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subdued)' }}>No link saved</span>
                                )}
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

      {/* TAB 3: CONTRACTORS */}
      {adminTab === 'contractors' && (
        <div>
          <h3 className="chart-title" style={{ marginBottom: '16px' }}>
            Contractors & Property Assignments
          </h3>

          <div className="properties-grid">
            {contractors.map(c => (
              <div key={c.id} className="property-card-pro" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{c.name}</h4>
                    {c.companyName && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.companyName}</div>}
                    {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-subdued)' }}>{c.email}</div>}
                  </div>
                  <span className={`status-pill ${c.active ? 'status-delivered' : 'status-submitted'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ margin: '14px 0', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {t('assignedProperties')}:
                  </div>

                  {c.assignedProperties && c.assignedProperties.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {c.assignedProperties.map((pName, idx) => (
                        <span key={idx} className="spec-pill" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                          {pName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-subdued)' }}>
                      {t('noAssignedProperties')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditingContractor(c);
                    setSelectedPropsToAssign(c.assignedProperties || []);
                  }}
                  className="role-tab-btn"
                  style={{ width: '100%', marginTop: '10px', background: 'var(--bg-slate)', border: '1px solid var(--border-color)' }}
                >
                  Edit Property Assignments
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER PRODUCTS CATALOG */}
      {adminTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="chart-title">{t('masterProductCatalog')}</h3>
            <button
              className="btn-auth-submit"
              style={{ width: 'auto', padding: '10px 20px', margin: 0, fontSize: '0.9rem' }}
              onClick={() => {
                setEditingProduct(null);
                setProdForm({ name: '', category: 'General', unit: 'each', details: '', supplierLink: '', expectedPrice: '', image: '', notes: '' });
                setShowProductModal(true);
              }}
            >
              {t('addNewProduct')}
            </button>
          </div>

          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" style={{ opacity: p.active ? 1 : 0.6 }}>
                <div>
                  <div className="product-header">
                    <span className="product-name">{p.name}</span>
                    <span className="product-category-tag">{p.category}</span>
                  </div>
                  {p.details && <div className="product-details">{p.details}</div>}
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-blue)', margin: '6px 0' }}>
                    Price: ${p.expectedPrice ? p.expectedPrice.toFixed(2) : '0.00'} / {p.unit || 'each'}
                  </div>

                  {p.supplierLink && (
                    <a href={p.supplierLink} target="_blank" rel="noreferrer" className="supplier-link-btn" style={{ margin: '6px 0 10px 0' }}>
                      Amazon Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setProdForm({
                        name: p.name,
                        category: p.category,
                        unit: p.unit || 'each',
                        details: p.details || '',
                        supplierLink: p.supplierLink || '',
                        expectedPrice: p.expectedPrice || '',
                        image: p.image || '',
                        notes: p.notes || ''
                      });
                      setShowProductModal(true);
                    }}
                    style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleProduct(p.productId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: p.active ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      background: p.active ? '#dcfce7' : '#fee2e2',
                      color: p.active ? '#15803d' : '#dc2626',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title={p.active ? 'Click to Deactivate Product' : 'Click to Activate Product'}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: p.active ? '#16a34a' : '#dc2626'
                    }} />
                    {p.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROPERTIES MANAGEMENT */}
      {adminTab === 'properties' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="chart-title">Manage Properties</h3>
            <button
              className="btn-auth-submit"
              style={{ width: 'auto', padding: '10px 20px', margin: 0, fontSize: '0.9rem' }}
              onClick={() => setShowPropertyModal(true)}
            >
              + Add Property
            </button>
          </div>

          <div className="properties-grid">
            {properties.map(p => (
              <div key={p.id} className="property-card-pro" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Building size={20} color="var(--primary-blue)" />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{p.name}</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {p.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                {editingProduct ? t('editProduct') : t('addNewProduct')}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="auth-form-group">
                <label>{t('productName')}</label>
                <input
                  type="text"
                  className="auth-input"
                  required
                  value={prodForm.name}
                  onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="auth-form-group">
                  <label>{t('category')}</label>
                  <input
                    type="text"
                    className="auth-input"
                    required
                    value={prodForm.category}
                    onChange={e => setProdForm({ ...prodForm, category: e.target.value })}
                  />
                </div>
                <div className="auth-form-group">
                  <label>{t('unit')}</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={prodForm.unit}
                    onChange={e => setProdForm({ ...prodForm, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>{t('modelDetails')}</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Brushed Nickel 4-inch / Model 8832"
                  value={prodForm.details}
                  onChange={e => setProdForm({ ...prodForm, details: e.target.value })}
                />
              </div>

              <div className="auth-form-group">
                <label>{t('supplierLink')}</label>
                <input
                  type="url"
                  className="auth-input"
                  placeholder="https://www.amazon.com/dp/..."
                  value={prodForm.supplierLink}
                  onChange={e => setProdForm({ ...prodForm, supplierLink: e.target.value })}
                />
              </div>

              <div className="auth-form-group">
                <label>{t('expectedPrice')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="auth-input"
                  value={prodForm.expectedPrice}
                  onChange={e => setProdForm({ ...prodForm, expectedPrice: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-auth-submit" style={{ margin: 0 }}>
                  {t('saveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPropertyModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Add Property</h3>
              <button onClick={() => setShowPropertyModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProperty}>
              <div className="auth-form-group">
                <label>Property Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 1006 Tunbridge Road"
                  required
                  value={propForm.name}
                  onChange={e => setPropForm({ ...propForm, name: e.target.value })}
                />
              </div>

              <div className="auth-form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 1006 Tunbridge Rd, Baltimore, MD"
                  required
                  value={propForm.address}
                  onChange={e => setPropForm({ ...propForm, address: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-auth-submit" style={{ margin: 0 }}>
                Save Property
              </button>
            </form>
          </div>
        </div>
      )}

      {editingContractor && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                Assign Properties to {editingContractor.name}
              </h3>
              <button onClick={() => setEditingContractor(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select which job sites this contractor can submit material requests for:
            </p>

            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px' }}>
              {properties.map(p => {
                const isSelected = selectedPropsToAssign.includes(p.name);
                return (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: isSelected ? 'var(--primary-blue-light)' : 'transparent', marginBottom: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPropsToAssign([...selectedPropsToAssign, p.name]);
                        } else {
                          setSelectedPropsToAssign(selectedPropsToAssign.filter(name => name !== p.name));
                        }
                      }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</span>
                  </label>
                );
              })}
            </div>

            <button onClick={handleSaveContractorProps} className="btn-auth-submit" style={{ margin: 0 }}>
              Save Property Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

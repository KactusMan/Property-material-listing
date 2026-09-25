import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Building, 
  Search, 
  Plus, 
  Minus, 
  Send, 
  FileText, 
  CheckCircle, 
  Clock, 
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import PropertyCatalog from './PropertyCatalog';
import SuccessModal from './SuccessModal';
import { apiFetch } from '../lib/api';
import { useI18n } from '../lib/i18n';

export default function ContractorDashboard({ user }) {
  const { t } = useI18n();
  const [properties, setProperties] = useState([]);
  const [products, setProducts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [error, setError] = useState('');

  const [viewTab, setViewTab] = useState('request'); // 'request' | 'my-requests' | 'properties'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resProp, resProd, resReq] = await Promise.all([
        apiFetch('/api/properties'),
        apiFetch('/api/products'),
        apiFetch('/api/requests')
      ]);

      if (![resProp, resProd, resReq].every((response) => response.ok)) {
        throw new Error('Could not load account data.');
      }

      const dataProp = await resProp.json();
      const dataProd = await resProd.json();
      const dataReq = await resReq.json();

      setProperties(dataProp);
      setProducts(dataProd);
      setMyRequests(dataReq);
    } catch (err) {
      console.error(err);
      setError('Unable to load your materials and requests. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (productId, newQty) => {
    const qty = Math.max(0, parseInt(newQty) || 0);
    setQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  const categories = [t('allCategories'), ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === t('allCategories') || selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.details && p.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Filter assigned properties if specified on user profile
  const assignedProps = user?.assignedProperties && user.assignedProperties.length > 0
    ? properties.filter(p => user.assignedProperties.includes(p.name))
    : properties;

  const totalSelectedCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const handleSubmit = async () => {
    setError('');
    if (!selectedProperty) {
      setError(t('selectProperty'));
      return;
    }

    const itemsToSubmit = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, quantity: qty }));

    if (itemsToSubmit.length === 0) {
      setError('Please select quantity for at least one product.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: selectedProperty,
          notes,
          items: itemsToSubmit
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit material request.');

      setQuantities({});
      setNotes('');
      setSubmittedRequestId(data.requestId);
      fetchInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const approvedRequests = myRequests.filter(r => r.status === 'Approved');
  const pendingRequests = myRequests.filter(r => r.status === 'Submitted');

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
        Loading Contractor Portal & Material Catalog...
      </div>
    );
  }

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">Total Submitted Requests</span>
          </div>
          <div className="metric-number">{myRequests.length}</div>
        </div>

        <div className="metric-card-pro">
          <div className="metric-header">
            <span className="metric-title">{t('approvedOrders')}</span>
          </div>
          <div className="metric-number" style={{ color: 'var(--primary-blue)' }}>
            {approvedRequests.length}
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
      </div>

      {/* Internal Navigation Tabs */}
      <div className="admin-nav-tabs">
        <button
          className={`role-tab-btn ${viewTab === 'request' ? 'active' : ''}`}
          onClick={() => setViewTab('request')}
        >
          {t('newMaterialRequest')}
        </button>

        <button
          className={`role-tab-btn ${viewTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => setViewTab('my-requests')}
        >
          {t('myRequests')} ({myRequests.length})
        </button>

        <button
          className={`role-tab-btn ${viewTab === 'properties' ? 'active' : ''}`}
          onClick={() => setViewTab('properties')}
        >
          {t('properties')}
        </button>
      </div>

      {/* TAB 1: NEW ORDER FORM */}
      {viewTab === 'request' && (
        <div>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Property Selection Card */}
          <div className="chart-card" style={{ marginBottom: '20px' }}>
            <h3 className="chart-title" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} color="var(--primary-blue)" />
              {t('selectProperty')}
            </h3>

            <select
              className="auth-input"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="">{t('chooseAssignedProperty')}</option>
              {(assignedProps.length > 0 ? assignedProps : properties).map(p => (
                <option key={p.id} value={p.name}>
                  📍 {p.name} — {p.address}
                </option>
              ))}
            </select>
          </div>

          {/* Material Catalog Grid */}
          <div className="chart-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 className="chart-title" style={{ margin: 0 }}>
                {t('approvedCatalog')} ({products.length} Items)
              </h3>
              
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder={t('searchMaterials')}
                  style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="category-pills">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards */}
            <div className="products-grid">
              {filteredProducts.map(prod => {
                const qty = quantities[prod.id] || 0;
                return (
                  <div key={prod.id} className={`product-card ${qty > 0 ? 'has-qty' : ''}`}>
                    <div>
                      <div className="product-header">
                        <span className="product-name">{prod.name}</span>
                        <span className="product-category-tag">{prod.category}</span>
                      </div>
                      {prod.details && <div className="product-details">{prod.details}</div>}
                      <div className="product-unit">{t('unit')}: {prod.unit || 'each'}</div>
                    </div>

                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, qty - 1)}
                        disabled={qty <= 0}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="qty-input"
                        value={qty}
                        onChange={(e) => handleQtyChange(prod.id, e.target.value)}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, qty + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Submit */}
          <div className="chart-card" style={{ marginBottom: '90px' }}>
            <h3 className="chart-title" style={{ marginBottom: '12px' }}>
              {t('orderNotes')}
            </h3>
            <textarea
              className="auth-input"
              rows="3"
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Floating Submit Bar */}
          <div className="bottom-submit-bar">
            <div className="submit-inner">
              <div className="items-summary-count">
                <Sparkles size={18} color="var(--primary-blue)" />
                <span>{t('selectedItems')}: <strong>{totalSelectedCount}</strong></span>
              </div>
              <button
                className="btn-auth-submit"
                style={{ width: 'auto', padding: '14px 32px', margin: 0 }}
                onClick={handleSubmit}
                disabled={submitting || totalSelectedCount === 0}
              >
                <Send size={18} />
                {submitting ? t('submitting') : t('submitRequest')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY REQUESTS FEED */}
      {viewTab === 'my-requests' && (
        <div>
          <h3 className="chart-title" style={{ marginBottom: '16px' }}>
            {t('submitted')} {t('materialRequests')} ({myRequests.length})
          </h3>

          {myRequests.length === 0 ? (
            <div className="chart-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {t('noRequestsYet')}
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.requestId} className="chart-card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1rem', color: 'var(--primary-blue)', marginRight: '10px' }}>
                      {req.requestId}
                    </span>
                    <span className={`status-pill status-${req.status.toLowerCase()}`}>
                      {t(req.status.toLowerCase()) || req.status}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>
                  📍 Property: {req.propertyName} {req.propertyAddress && `(${req.propertyAddress})`}
                </div>

                {req.notes && (
                  <div style={{ background: 'var(--bg-slate)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <strong>Notes:</strong> {req.notes}
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {t('itemsRequested')}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {req.items.map((item, idx) => (
                    <span key={idx} className="spec-pill" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                      {item.productName} × <strong>{item.quantity}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PROPERTIES */}
      {viewTab === 'properties' && (
        <PropertyCatalog
          onSelectPropertyForOrder={(propName) => {
            setSelectedProperty(propName);
            setViewTab('request');
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        requestId={submittedRequestId}
        onClose={() => setSubmittedRequestId(null)}
      />
    </div>
  );
}

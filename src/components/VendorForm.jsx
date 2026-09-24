import React, { useState, useEffect } from 'react';
import { 
  Building, 
  User, 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Send, 
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function VendorForm({ onSuccess }) {
  const [contractors, setContractors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedContractor, setSelectedContractor] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load Initial Data from MongoDB API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [resCont, resProp, resProd] = await Promise.all([
        fetch('/api/contractors'),
        fetch('/api/properties'),
        fetch('/api/products')
      ]);

      if (!resCont.ok || !resProp.ok || !resProd.ok) {
        throw new Error('Could not connect to MongoDB server.');
      }

      const dataCont = await resCont.json();
      const dataProp = await resProp.json();
      const dataProd = await resProd.json();

      setContractors(dataCont);
      setProperties(dataProp);
      setProducts(dataProd);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load data from MongoDB database. Is the backend server running?');
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

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Filter products by category and search term
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (prod.details && prod.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate total selected items count
  const totalSelectedCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  // Submit Request Handler
  const handleSubmit = async () => {
    setErrorMessage('');

    if (!selectedContractor) {
      setErrorMessage('Please select your Contractor / Vendor name.');
      return;
    }
    if (!selectedProperty) {
      setErrorMessage('Please select the Property you are working on.');
      return;
    }

    const itemsToSubmit = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, quantity: qty }));

    if (itemsToSubmit.length === 0) {
      setErrorMessage('Please enter a quantity (> 0) for at least one material item.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor: selectedContractor,
          property: selectedProperty,
          notes,
          items: itemsToSubmit
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request.');
      }

      // Reset Form State
      setQuantities({});
      setNotes('');
      onSuccess(result.requestId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--pink-dark)' }}>
          🌸 Loading material database from MongoDB...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message Box */}
      {errorMessage && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1.5px solid #ef9a9a',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={22} color="#c62828" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Vendor & Property Selector Card */}
      <div className="card">
        <h2 className="card-title">
          <User size={22} color="var(--pink-primary)" />
          1. Select Vendor & Property
        </h2>

        <div className="form-group">
          <label htmlFor="vendorSelect">Vendor / Contractor Name *</label>
          <select
            id="vendorSelect"
            className="input-select"
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
          >
            <option value="">-- Choose Vendor / Contractor --</option>
            {contractors.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="propertySelect">Property Being Worked On *</label>
          <select
            id="propertySelect"
            className="input-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value="">-- Choose Property --</option>
            {properties.map(p => (
              <option key={p.id} value={p.name}>
                {p.name} — {p.address}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <Package size={22} color="var(--pink-primary)" />
            2. Approved Materials Catalog ({products.length} Items)
          </h2>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-text"
              placeholder="Search materials..."
              style={{ paddingLeft: '38px', height: '42px', fontSize: '0.95rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
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

        {/* Products Grid */}
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

                  {prod.details && (
                    <div className="product-details">{prod.details}</div>
                  )}

                  <div className="product-unit">
                    Unit: <strong>{prod.unit || 'each'}</strong>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="quantity-control">
                  <button
                    className="qty-btn"
                    onClick={() => handleQtyChange(prod.id, qty - 1)}
                    disabled={qty <= 0}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
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
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes Card */}
      <div className="card">
        <h2 className="card-title">
          <FileText size={22} color="var(--pink-primary)" />
          3. Additional Order Notes
        </h2>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <textarea
            className="input-textarea"
            rows="3"
            placeholder="Example: 2 boxes for basement bathroom, deliver by Friday morning..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="bottom-submit-bar">
        <div className="submit-inner">
          <div className="items-summary-count">
            <Sparkles size={20} color="var(--pink-primary)" />
            <span>Total Selected: <strong>{totalSelectedCount} items</strong></span>
          </div>

          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={submitting || totalSelectedCount === 0}
          >
            <Send size={20} />
            {submitting ? 'Submitting to MongoDB...' : '🩷 Submit Material Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

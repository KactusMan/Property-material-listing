import React, { useState } from 'react';
import { X, Sparkles, Send, Box, DollarSign } from 'lucide-react';

export default function ConstructorRequestModal({ listings, initialListingId, onClose, onSubmit }) {
  const [listingId, setListingId] = useState(initialListingId || listings[0]?.id || "422113");
  const [category, setCategory] = useState("Lumber & Framing");
  const [materialRequested, setMaterialRequested] = useState("500 Structural Woods / Timber Units");
  const [amountRequested, setAmountRequested] = useState("18500");
  const [urgency, setUrgency] = useState("High Priority");
  const [message, setMessage] = useState("we are out of 500 woods for property listing 1 and we require the monies");

  // Quick fill scenario matching user prompt
  const handleQuickFillScenario1 = () => {
    setListingId("422113"); // Houston TX
    setCategory("Lumber & Framing");
    setMaterialRequested("500 Woods / Framing Timber");
    setAmountRequested("18500");
    setUrgency("High Priority");
    setMessage("we are out of 500 woods for property listing 1 and we require the monies");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSubmit({
      listingId,
      category,
      materialRequested,
      amountRequested: Number(amountRequested) || 0,
      urgency,
      message
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Constructor Materials & Monies Request</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="quick-fill-box">
          <div className="quick-fill-text">
            <strong>One-Click Prompt Requirement Fill</strong>
            <p>"we are out of 500 woods for property listing 1 and we require the monies"</p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleQuickFillScenario1}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <Sparkles size={14} color="var(--pink-accent)" />
            Auto-Fill
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Target Property Listing</label>
            <select 
              className="form-control" 
              value={listingId} 
              onChange={e => setListingId(e.target.value)}
            >
              {listings.map(l => (
                <option key={l.id} value={l.id}>
                  Listing #{l.id} - {l.title} ({l.location.split(',')[0]})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Material / Category</label>
              <input 
                type="text" 
                className="form-control" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="e.g. Lumber & Wood"
                required 
              />
            </div>

            <div className="form-group">
              <label>Quantity / Description</label>
              <input 
                type="text" 
                className="form-control" 
                value={materialRequested} 
                onChange={e => setMaterialRequested(e.target.value)} 
                placeholder="e.g. 500 Woods"
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Monies Required ($ USD)</label>
              <input 
                type="number" 
                className="form-control" 
                value={amountRequested} 
                onChange={e => setAmountRequested(e.target.value)} 
                placeholder="18500"
                required 
              />
            </div>

            <div className="form-group">
              <label>Urgency Level</label>
              <select 
                className="form-control" 
                value={urgency} 
                onChange={e => setUrgency(e.target.value)}
              >
                <option value="Normal">Normal</option>
                <option value="High Priority">High Priority (Work Halted)</option>
                <option value="Critical">Critical Emergency</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Constructor Note to Agency / Owner</label>
            <textarea 
              className="form-control" 
              rows={4} 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Detail your request..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={16} />
              Submit Request to Agency
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

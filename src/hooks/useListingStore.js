import { useState, useEffect } from 'react';
import { INITIAL_LISTINGS, INITIAL_REQUESTS } from '../data/initialData';

export function useListingStore() {
  const [listings, setListings] = useState(() => {
    const saved = localStorage.getItem('aura_listings');
    return saved ? JSON.parse(saved) : INITIAL_LISTINGS;
  });

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('aura_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activeRole, setActiveRole] = useState('agency'); // 'agency' | 'constructor'

  useEffect(() => {
    localStorage.setItem('aura_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('aura_requests', JSON.stringify(requests));
  }, [requests]);

  // Add new request from Constructor
  const addRequest = (newReq) => {
    const targetListing = listings.find(l => l.id === newReq.listingId);
    const created = {
      requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      listingId: newReq.listingId,
      listingTitle: targetListing ? `${targetListing.title} (${targetListing.code})` : `Listing #${newReq.listingId}`,
      contractorName: targetListing?.contractor || "Primary Construction Partner",
      category: newReq.category || "Materials & Monies",
      materialRequested: newReq.materialRequested || "Construction Supplies",
      amountRequested: Number(newReq.amountRequested) || 0,
      urgency: newReq.urgency || "Normal",
      status: "Pending Agency Action",
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: newReq.message,
      agencyResponse: null,
      actionTimeline: [
        { step: "Request Logged by Constructor", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: "Constructor" }
      ]
    };

    setRequests(prev => [created, ...prev]);
    return created;
  };

  // Follow through request from Agency (Approve / Fund / Reject / Inspect)
  const processAgencyFollowThrough = (requestId, decision, note = "", customAmount = null) => {
    setRequests(prev => prev.map(req => {
      if (req.requestId !== requestId) return req;

      const finalAmount = customAmount !== null ? customAmount : req.amountRequested;
      let newStatus = req.status;

      if (decision === 'approve') {
        newStatus = 'Approved & Dispatched';
      } else if (decision === 'in_review') {
        newStatus = 'Under Agency Inspection';
      } else if (decision === 'decline') {
        newStatus = 'Declined';
      }

      const updatedTimeline = [
        ...req.actionTimeline,
        {
          step: decision === 'approve' 
            ? `Monies Released ($${finalAmount.toLocaleString()})`
            : decision === 'in_review' ? 'Site Audit Scheduled' : 'Request Declined',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Agency HQ'
        }
      ];

      return {
        ...req,
        status: newStatus,
        agencyResponse: {
          decision,
          note: note || (decision === 'approve' 
            ? `Agency has verified and dispatched $${finalAmount.toLocaleString()} to contractor account. Woods procurement authorized.`
            : `Agency requested further site verification.`),
          dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dispatchedAmount: decision === 'approve' ? finalAmount : 0
        },
        actionTimeline: updatedTimeline
      };
    }));

    // Update listing budget spent if approved
    if (decision === 'approve') {
      const targetReq = requests.find(r => r.requestId === requestId);
      if (targetReq) {
        setListings(prev => prev.map(l => {
          if (l.id === targetReq.listingId) {
            const currentSpent = parseInt(l.budgetSpent.replace(/[^0-9]/g, '')) || 0;
            const added = customAmount !== null ? customAmount : targetReq.amountRequested;
            return {
              ...l,
              budgetSpent: `$${(currentSpent + added).toLocaleString()}`
            };
          }
          return l;
        }));
      }
    }
  };

  // Reset to default sample state
  const resetDemoData = () => {
    setListings(INITIAL_LISTINGS);
    setRequests(INITIAL_REQUESTS);
    localStorage.removeItem('aura_listings');
    localStorage.removeItem('aura_requests');
  };

  return {
    listings,
    requests,
    activeRole,
    setActiveRole,
    addRequest,
    processAgencyFollowThrough,
    resetDemoData
  };
}

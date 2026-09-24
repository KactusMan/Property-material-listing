export const INITIAL_LISTINGS = [
  {
    id: "422113",
    title: "The Grand Houston Residence",
    location: "Houston, Texas (TX 77019)",
    code: "HTX-422113",
    price: "$4,250,000",
    budgetAllocated: "$1,800,000",
    budgetSpent: "$640,000",
    progressPct: 45,
    status: "Active Construction",
    contractor: "Apex Luxury Builders Inc.",
    image: "/houston_estate.png",
    specs: {
      beds: 6,
      baths: 7,
      sqft: "8,500 sq ft",
      woodsNeeded: "500 Framing Lumber Units"
    },
    description: "Ultra-luxury modern estate in River Oaks, Houston. Currently undergoing timber framing phase."
  },
  {
    id: "131234",
    title: "Arizona Desert Oasis Modern Villa",
    location: "Paradise Valley, Arizona (AZ 85253)",
    code: "AZ-131234",
    price: "$6,100,000",
    budgetAllocated: "$2,400,000",
    budgetSpent: "$1,150,000",
    progressPct: 70,
    status: "Finishing Phase",
    contractor: "Vanguard Desert Craft",
    image: "/arizona_villa.png",
    specs: {
      beds: 5,
      baths: 6.5,
      sqft: "9,200 sq ft",
      woodsNeeded: "Teak Cladding Panels"
    },
    description: "Architectural masterpiece featuring custom glass walls, infinity pool, and high-end timber paneling."
  }
];

export const INITIAL_REQUESTS = [
  {
    requestId: "REQ-9901",
    listingId: "422113",
    listingTitle: "The Grand Houston Residence (HTX-422113)",
    contractorName: "Apex Luxury Builders Inc.",
    category: "Lumber & Materials",
    materialRequested: "500 Custom Woods / Framing Timber",
    amountRequested: 18500,
    urgency: "High Priority",
    status: "Pending Agency Action", // "Pending Agency Action" | "Approved & Dispatched" | "In Review" | "Declined"
    submittedAt: "Today, 09:30 AM",
    message: "we are out of 500 woods for property listing 1 and we require the monies",
    agencyResponse: null,
    actionTimeline: [
      { step: "Request Logged by Constructor", timestamp: "09:30 AM", actor: "Apex Luxury Builders" }
    ]
  }
];

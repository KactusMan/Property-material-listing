export const initialProducts = [
  // Flooring
  { productId: "P001", name: "LVP Flooring - Oak Plank", category: "Flooring", unit: "sq ft", details: "Waterproof luxury vinyl plank 7mm with underlayment", expectedPrice: 3.25, image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P002", name: "Laminate Flooring - Warm Walnut", category: "Flooring", unit: "sq ft", details: "12mm scratch-resistant laminate", expectedPrice: 2.80, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P003", name: "Porcelain Tile Flooring 12x24", category: "Flooring", unit: "sq ft", details: "Matte gray porcelain floor tile", expectedPrice: 4.50, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P004", name: "Hardwood Flooring - Solid Oak", category: "Flooring", unit: "sq ft", details: "3/4 in solid red oak prefinished", expectedPrice: 6.90, image: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P005", name: "Flooring Removal & Disposal", category: "Flooring", unit: "sq ft", details: "Demolition and haul away of existing carpet/tile/vinyl", expectedPrice: 1.50, active: true },

  // Kitchen
  { productId: "P006", name: "Full Kitchen Renovation Allowance", category: "Kitchen", unit: "job", details: "Complete kitchen gut & rebuild labor + standard materials", expectedPrice: 8500.00, active: true },
  { productId: "P007", name: "Shaker Kitchen Cabinets - White", category: "Kitchen", unit: "linear ft", details: "Solid wood frame soft-close hinges", expectedPrice: 185.00, image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P008", name: "Cabinet Refacing & Hardware Package", category: "Kitchen", unit: "job", details: "New doors, drawer fronts & brushed brass handles", expectedPrice: 2400.00, active: true },
  { productId: "P009", name: "Quartz Countertops - Calacatta Gold", category: "Kitchen", unit: "sq ft", details: "3cm engineered quartz with eased edge", expectedPrice: 68.00, image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P010", name: "Subway Tile Backsplash", category: "Kitchen", unit: "sq ft", details: "3x6 glossy white subway tile with white grout", expectedPrice: 12.00, active: true },
  { productId: "P011", name: "Undermount Stainless Kitchen Sink 30in", category: "Kitchen", unit: "each", details: "16-gauge single bowl stainless steel", expectedPrice: 220.00, active: true },
  { productId: "P012", name: "Pull-Down Kitchen Faucet - Matte Black", category: "Kitchen", unit: "each", details: "High arch commercial style single handle", expectedPrice: 145.00, active: true },
  { productId: "P013", name: "Garbage Disposal 3/4 HP", category: "Kitchen", unit: "each", details: "Heavy duty continuous feed sound insulated", expectedPrice: 130.00, active: true },
  { productId: "P014", name: "Stainless Steel Range Hood 30in", category: "Kitchen", unit: "each", details: "Ducted 400 CFM under-cabinet range hood", expectedPrice: 189.00, active: true },

  // Bathroom
  { productId: "P015", name: "Full Bathroom Gut Renovation", category: "Bathroom", unit: "job", details: "Complete tub to tile demolition and full rebuild", expectedPrice: 5200.00, active: true },
  { productId: "P016", name: "Bathroom Vanity with Quartz Top 36in", category: "Bathroom", unit: "each", details: "Single sink vanity with soft-close drawers & quartz countertop", expectedPrice: 590.00, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80", active: true },
  { productId: "P017", name: "Dual-Flush Elongated Toilet 1.28 GPF", category: "Bathroom", unit: "each", details: "High-efficiency 1-piece ceramic toilet", expectedPrice: 210.00, active: true },
  { productId: "P018", name: "Single-Hole Bathroom Faucet - Brushed Nickel", category: "Bathroom", unit: "each", details: "Lead-free brass construction with pop-up drain", expectedPrice: 85.00, active: true },
  { productId: "P019", name: "Pedestal Sink 24in", category: "Bathroom", unit: "each", details: "Classic white vitreous china pedestal sink", expectedPrice: 140.00, active: true },
  { productId: "P020", name: "Acrylic Tub & Shower Surround Replacement", category: "Bathroom", unit: "each", details: "60in alcove tub with 3-piece wall surround", expectedPrice: 850.00, active: true },
  { productId: "P021", name: "Shower Tile Installation", category: "Bathroom", unit: "sq ft", details: "Waterproof membrane + ceramic wall tile labor & materials", expectedPrice: 24.00, active: true },
  { productId: "P022", name: "Bathroom Exhaust Fan with LED Light 110 CFM", category: "Bathroom", unit: "each", details: "Ultra-quiet ceiling ventilation fan", expectedPrice: 115.00, active: true },

  // Plumbing
  { productId: "P023", name: "Plumbing Repair Labor", category: "Plumbing", unit: "hour", details: "Licensed plumber hourly service rate", expectedPrice: 95.00, active: true },
  { productId: "P024", name: "50-Gallon Gas Water Heater", category: "Plumbing", unit: "each", details: "Tall atmospheric vent water heater 40,000 BTU", expectedPrice: 820.00, active: true },
  { productId: "P025", name: "Sewer Line Replacement", category: "Plumbing", unit: "job", details: "Trenchless or traditional main line sewer replacement", expectedPrice: 3800.00, active: true },
  { productId: "P026", name: "Whole-House PEX Repipe", category: "Plumbing", unit: "job", details: "Replace galvanized/copper pipes with PEX water lines", expectedPrice: 4200.00, active: true },

  // Electrical
  { productId: "P027", name: "Electrical Panel Upgrade 100A to 200A", category: "Electrical", unit: "job", details: "Main breaker panel upgrade including permit & utility hookup", expectedPrice: 2600.00, active: true },
  { productId: "P028", name: "200A Subpanel Installation", category: "Electrical", unit: "each", details: "24-circuit subpanel with breakers", expectedPrice: 750.00, active: true },
  { productId: "P029", name: "120V Outlet / Switch Replacement", category: "Electrical", unit: "each", details: "Decora white receptacle or light switch", expectedPrice: 18.00, active: true },
  { productId: "P030", name: "Electrical Labor Hourly", category: "Electrical", unit: "hour", details: "Licensed electrician troubleshooting & installation", expectedPrice: 90.00, active: true },
  { productId: "P031", name: "Light Fixture Installation", category: "Electrical", unit: "each", details: "Mounting ceiling fixture, pendant, or vanity light", expectedPrice: 65.00, active: true },
  { productId: "P032", name: "Recessed Ultra-Thin Canless LED Light 6in", category: "Electrical", unit: "each", details: "Selectable CCT 3000K-5000K dimmable LED fixture", expectedPrice: 22.00, active: true },

  // Painting
  { productId: "P033", name: "Interior Painting - Walls & Trim", category: "Painting", unit: "sq ft", details: "2 coats premium eggshell paint + trim enamel", expectedPrice: 1.85, active: true },
  { productId: "P034", name: "Exterior Painting - Whole House", category: "Painting", unit: "job", details: "Pressure wash, prime, 2 coats acrylic exterior latex", expectedPrice: 3400.00, active: true },
  { productId: "P035", name: "Whole-House Interior Paint Package Allowance", category: "Painting", unit: "job", details: "Complete interior ceiling, doors, walls & baseboards", expectedPrice: 2800.00, active: true },

  // Siding & Exterior
  { productId: "P036", name: "Vinyl Siding Installation", category: "Siding & Exterior", unit: "sq ft", details: "Double 4in lap vinyl siding with house wrap", expectedPrice: 4.80, active: true },
  { productId: "P037", name: "Fiber-Cement Hardie Siding", category: "Siding & Exterior", unit: "sq ft", details: "James Hardie 8.25in lap siding primed", expectedPrice: 7.20, active: true },
  { productId: "P038", name: "Siding Removal & Disposal", category: "Siding & Exterior", unit: "sq ft", details: "Tear-off old wood/aluminum siding and debris haul", expectedPrice: 1.20, active: true },
  { productId: "P039", name: "Baseboard Trim 3.5in White PVC/MDF", category: "Siding & Exterior", unit: "linear ft", details: "Craftsman style baseboard trim primed", expectedPrice: 2.10, active: true },
  { productId: "P040", name: "Soffit & Fascia Replacement", category: "Siding & Exterior", unit: "linear ft", details: "Aluminum vented soffit & wrapped fascia board", expectedPrice: 9.50, active: true },

  // Landscaping
  { productId: "P041", name: "Basic Lawn & Garden Cleanup", category: "Landscaping", unit: "job", details: "Mowing, weeding, edging, and leaf removal", expectedPrice: 250.00, active: true },
  { productId: "P042", name: "New Lawn Sod Installation", category: "Landscaping", unit: "sq ft", details: "Soil prep, leveling & fresh sod installation", expectedPrice: 1.45, active: true },
  { productId: "P043", name: "Black Shredded Mulch Installation", category: "Landscaping", unit: "cubic yd", details: "Delivered & spread 3in deep in garden beds", expectedPrice: 75.00, active: true },
  { productId: "P044", name: "Front Yard Landscaping Package", category: "Landscaping", unit: "job", details: "Shrubs, mulch, stone border & focal accent plants", expectedPrice: 1200.00, active: true },
  { productId: "P045", name: "Garden Bed Installation", category: "Landscaping", unit: "each", details: "Timber framed raised garden bed with topsoil", expectedPrice: 320.00, active: true },
  { productId: "P046", name: "Tree Planting (15 Gallon Shade Tree)", category: "Landscaping", unit: "each", details: "Maple or Red Oak planted with stake support", expectedPrice: 280.00, active: true },
  { productId: "P047", name: "Retaining Wall Installation", category: "Landscaping", unit: "sq ft", details: "Concrete block retaining wall with gravel backfill", expectedPrice: 28.00, active: true },

  // Appliances
  { productId: "P048", name: "French Door Refrigerator 26 cu ft", category: "Appliances", unit: "each", details: "Stainless steel energy star refrigerator with ice maker", expectedPrice: 1450.00, active: true },
  { productId: "P049", name: "Freestanding Gas Range / Stove 30in", category: "Appliances", unit: "each", details: "5-burner gas range with self-cleaning oven", expectedPrice: 750.00, active: true },
  { productId: "P050", name: "Top Control Stainless Steel Dishwasher", category: "Appliances", unit: "each", details: "Quiet 48 dBA dishwasher with stainless tub", expectedPrice: 580.00, active: true },
  { productId: "P051", name: "Over-the-Range Microwave 1.9 cu ft", category: "Appliances", unit: "each", details: "1000W stainless steel microwave with vent", expectedPrice: 240.00, active: true },
  { productId: "P052", name: "Front Load Washer 4.5 cu ft", category: "Appliances", unit: "each", details: "High-efficiency stackable front load washer", expectedPrice: 780.00, active: true },
  { productId: "P053", name: "Electric Dryer 7.4 cu ft", category: "Appliances", unit: "each", details: "Matching electric dryer with sensor dry", expectedPrice: 720.00, active: true },
  { productId: "P054", name: "4-Piece Stainless Kitchen Appliance Package", category: "Appliances", unit: "package", details: "Fridge, Gas Range, Dishwasher & OTR Microwave", expectedPrice: 2750.00, active: true },
  { productId: "P055", name: "Appliance Installation & Delivery Fee", category: "Appliances", unit: "job", details: "Delivery, unboxing, gas/water hookups and haul away", expectedPrice: 220.00, active: true },

  // Roofing & Windows
  { productId: "P056", name: "Architectural Shingle Roof Replacement", category: "Roofing & Windows", unit: "sq ft", details: "30-year dimensional shingles, synthetic underlayment & drip edge", expectedPrice: 4.20, active: true },
  { productId: "P057", name: "Seamless Aluminum Gutter System 5in", category: "Roofing & Windows", unit: "linear ft", details: "Seamless K-style gutters with downspouts & splash blocks", expectedPrice: 8.50, active: true },
  { productId: "P058", name: "Double-Pane Vinyl Replacement Window", category: "Roofing & Windows", unit: "each", details: "Low-E Argon filled energy efficient double-hung window", expectedPrice: 380.00, active: true },

  // Permits & Service
  { productId: "P059", name: "City Building Permit & Inspection Allowance", category: "Permits & Service", unit: "job", details: "Official municipal permit fees and code inspection pass-through", expectedPrice: 450.00, active: true }
];

export const initialProperties = [
  { propertyId: "PR001", name: "PR001", address: "1006 Tunbridge Road", active: true },
  { propertyId: "PR002", name: "PR002", address: "1808 N Spring St", active: true },
  { propertyId: "PR003", name: "PR003", address: "1912 Arwell Ct", active: true },
  { propertyId: "PR004", name: "PR004", address: "27 Dorchester Court", active: true },
  { propertyId: "PR005", name: "PR005", address: "3125 Brendan Avenue", active: true },
  { propertyId: "PR006", name: "PR006", address: "3344 Kenyon Ave", active: true },
  { propertyId: "PR007", name: "PR007", address: "3925 Rexmere Road", active: true },
  { propertyId: "PR008", name: "PR008", address: "4920 Chalgrove Ave", active: true },
  { propertyId: "PR009", name: "PR009", address: "5204 Eugene Avenue", active: true },
  { propertyId: "PR010", name: "PR010", address: "597 Belmawr Pl", active: true },
  { propertyId: "PR011", name: "PR011", address: "883 Bellevue Street Southeast", active: true },
  { propertyId: "PR012", name: "PR012", address: "3525 Kentucky Ave Baltimore, MD", active: true },
  { propertyId: "PR013", name: "PR013", address: "20120 Halethorpe Ln Germantown, MD", active: true },
  { propertyId: "PR014", name: "PR014", address: "1015 Floyd Ave", active: true },
  { propertyId: "PR015", name: "PR015", address: "2416 Lake Ave", active: true },
  { propertyId: "PR016", name: "PR016", address: "10222 Prince PL", active: true },
  { propertyId: "PR017", name: "PR017", address: "3698 Kenyon Ave", active: true },
  { propertyId: "PR018", name: "PR018", address: "810 Wedgewood", active: true },
  { propertyId: "PR019", name: "PR019", address: "5607 Knell", active: true }
];

export const initialContractors = [
  { contractorId: "CON001", name: "Apex Builders & Renovations", active: true },
  { contractorId: "CON002", name: "Premier Craft Contracting", active: true },
  { contractorId: "CON003", name: "Heritage Property Services", active: true },
  { contractorId: "CON004", name: "Summit Interior Contractors", active: true },
  { contractorId: "CON005", name: "Evergreen Electric & Plumbing", active: true },
  { contractorId: "CON006", name: "Vanguard Roofing & Siding", active: true }
];

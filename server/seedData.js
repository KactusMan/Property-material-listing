import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const isActive = (value) => value !== false && value !== 0 && value !== '0' && value !== 'FALSE';
const clean = (value) => String(value ?? '').trim();

const readSheet = (workbook, ...names) => {
  const sheet = names.map((n) => workbook.Sheets[n]).find(Boolean);
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: '' }) : [];
};

// Properties confirmed in Ayesha's MatFlow prototype that are not in the original workbook yet.
const EXTRA_PROPERTIES = [{ name: '16933 Briardale Rd Derwood, MD 20855', address: '16933 Briardale Rd Derwood, MD 20855' }];

export const loadWorkbook = (file = 'property materials manager.xlsx') => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) throw new Error(`Workbook not found: ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  const products = readSheet(workbook, 'products database')
    .filter((row) => clean(row['Product ID']) && clean(row['Product Name']))
    .map((row) => ({
      productId: clean(row['Product ID']),
      name: clean(row['Product Name']),
      category: clean(row['Category']) || 'General',
      unit: clean(row['Unit']) || 'each',
      details: clean(row['Model / Size / Color']),
      supplierLink: clean(row['Supplier Link']),
      expectedPrice: Number(row['Expected Price'] || 0),
      image: clean(row['Image URL']),
      notes: clean(row['Notes']),
      source: 'workbook',
      active: isActive(row['Active'])
    }));

  const properties = readSheet(workbook, 'properties', 'Properties')
    .filter((row) => clean(row['Property ID']) && clean(row['Property Name']))
    .map((row) => ({
      propertyId: clean(row['Property ID']),
      name: clean(row['Property Name']),
      address: clean(row['Address']) || clean(row['Property Name']),
      active: isActive(row['Active'])
    }));

  const contractors = readSheet(workbook, 'Contractors', 'contractors')
    .filter((row) => clean(row['Contractor ID']) && clean(row['Contractor Name']))
    .map((row) => ({
      contractorId: clean(row['Contractor ID']),
      name: clean(row['Contractor Name']).replace('JimÃ©nez', 'Jiménez'),
      active: isActive(row['Active'])
    }));

  // The Requests sheet is the only place the workbook pairs a vendor with a property.
  const propertyByName = new Map(properties.map((p) => [p.name.toLowerCase(), p.propertyId]));
  const vendorByName = new Map(contractors.map((c) => [c.name.toLowerCase(), c.contractorId]));
  const assignments = [];
  for (const row of readSheet(workbook, 'Requests')) {
    const propertyId = propertyByName.get(clean(row['Property']).toLowerCase());
    const contractorId = vendorByName.get(clean(row['Contractor']).toLowerCase());
    if (propertyId && contractorId && !assignments.some((a) => a.propertyId === propertyId && a.contractorId === contractorId)) {
      assignments.push({ contractorId, propertyId, vendor: clean(row['Contractor']), property: clean(row['Property']) });
    }
  }

  return { products, properties, contractors, assignments, extraProperties: EXTRA_PROPERTIES };
};

const LINK_CATEGORIES = [
  [/vanity|faucet|shower|bathroom hardware/i, 'Bathroom'],
  [/lock|cabinet|hinge|door handle|knob/i, 'Hardware'],
  [/doorbell|light|bulb|wall plate/i, 'Electrical'],
  [/garbage disposal/i, 'Kitchen'],
  [/lvp|laminate|hardwood|tile/i, 'Flooring'],
  [/roofing/i, 'Roofing'],
  [/lumber/i, 'Lumber'],
  [/paint/i, 'Painting'],
  [/trowel/i, 'Tools'],
  [/concrete|access panel/i, 'Building materials'],
  [/cpvc|pvc|tape|sharkbite|trap|coupling|elbow/i, 'Plumbing']
];

// "material list with links.xlsx": material name plus a hyperlinked Amazon or Home Depot listing.
export const loadMaterialLinks = (file = 'material list with links.xlsx') => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) return [];
  const sheet = XLSX.readFile(filePath).Sheets.Sheet1;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const items = [];
  for (let r = 1; r < rows.length; r += 1) {
    const name = clean(rows[r][0]);
    const label = clean(rows[r][1]);
    const cell = sheet[`B${r + 1}`];
    if (!name || !cell?.l?.Target) continue;
    const url = new URL(cell.l.Target.replace(/&amp;/g, '&'));
    url.searchParams.delete('utm_source');
    const store = url.hostname.includes('amazon') ? 'Amazon' : 'Home Depot';
    items.push({
      name,
      category: (LINK_CATEGORIES.find(([pattern]) => pattern.test(name)) || [null, 'General'])[1],
      unit: /lvp|laminate|hardwood|tile/i.test(name) ? 'case' : 'each',
      details: label.replace(/^(Amazon|Home Depot)\s*[–—-]\s*/i, ''),
      supplierLink: url.toString(),
      store,
      expectedPrice: 0,
      notes: url.pathname.startsWith('/s') ? 'Search link from the material list. Use the assistant to pick a specific listing and price.' : 'From the material list with links.',
      source: 'links',
      active: true
    });
  }
  return items;
};

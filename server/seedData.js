import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export const loadExcelData = () => {
  const filePath = path.resolve(process.cwd(), 'property materials manager.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.warn('Excel file not found at', filePath, '. Using fallback defaults.');
    return null;
  }

  try {
    const workbook = XLSX.readFile(filePath);
    
    // Parse Products Database
    const prodSheet = workbook.Sheets['products database'] || workbook.Sheets[workbook.SheetNames[0]];
    const rawProducts = XLSX.utils.sheet_to_json(prodSheet);
    const products = rawProducts.map((row, idx) => ({
      productId: row['Product ID'] || `P${String(idx + 1).padStart(3, '0')}`,
      name: row['Product Name'] || row['product name'] || 'Unnamed Product',
      category: row['Category'] || 'General',
      unit: row['Unit'] || 'each',
      details: row['Model / Size / Color'] || row['Details'] || '',
      supplierLink: row['Supplier Link'] || '',
      expectedPrice: Number(row['Expected Price'] || row['expected price'] || 0),
      image: row['Image URL'] || '',
      notes: row['Notes'] || '',
      active: row['Active'] === false ? false : true
    }));

    // Parse Properties
    const propSheet = workbook.Sheets['properties'] || workbook.Sheets['Properties'];
    const rawProperties = propSheet ? XLSX.utils.sheet_to_json(propSheet) : [];
    const properties = rawProperties.map((row, idx) => ({
      propertyId: row['Property ID'] || `PR${String(idx + 1).padStart(3, '0')}`,
      name: row['Property Name'] || `PR00${idx + 1}`,
      address: row['Address'] || row['Property Name'] || 'Address Pending',
      active: row['Active'] === false ? false : true
    }));

    // Parse Contractors
    const contSheet = workbook.Sheets['Contractors'] || workbook.Sheets['contractors'];
    const rawContractors = contSheet ? XLSX.utils.sheet_to_json(contSheet) : [];
    const contractors = rawContractors.map((row, idx) => ({
      contractorId: row['Contractor ID'] || `C${String(idx + 1).padStart(3, '0')}`,
      name: row['Contractor Name'] || `Contractor ${idx + 1}`,
      active: row['Active'] === false ? false : true
    }));

    return { products, properties, contractors };
  } catch (err) {
    console.error('Error reading Excel file:', err.message);
    return null;
  }
};

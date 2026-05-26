import * as db from '../lib/db';

const VENDOR_TABLE = db.getTableName('Vendor');
const HEADERS = [
  'SKU Code',
  'SKU Description',
  'Category',
  'UOM',
  'Vendor Name',
  'Alternate Vendors',
  'Vendor Code',
  'Vendor Contact',
  'Vendor Email',
  'Address',
  'State',
  'State Code',
  'A/C Code',
  'GSTIN',
  'PAN No.',
  'MOQ',
  'Lead Time (Days)',
  'Last Purchase Rate (₹)',
  'Rate Validity',
  'Payment Terms',
  'Remarks',
];

// Function to map new form data to old Google Sheets format
const mapFormDataToSheets = (formData) => {
  const primaryContact = formData.contacts?.[0] || {};
  const primaryProduct = formData.products?.[0] || {};
  
  return {
    'SKU Code': primaryProduct.skuCode || '',
    'SKU Description': primaryProduct.skuDescription || '',
    'Category': primaryProduct.category || formData.category || '',
    'UOM': primaryProduct.uom || '',
    'Vendor Name': formData.vendorName || '',
    'Alternate Vendors': primaryProduct.alternateVendors || '',
    'Vendor Code': formData.vendorCode || '',
    'Vendor Contact': primaryContact.name || '',
    'Vendor Email': primaryContact.email || '',
    'Address': formData.address || '',
    'State': formData.state || '',
    'State Code': formData.stateCode || '',
    'A/C Code': formData.accountCode || '',
    'GSTIN': formData.gstin || '',
    'PAN No.': formData.panNumber || '',
    'MOQ': primaryProduct.moq || '',
    'Lead Time (Days)': primaryProduct.leadTime || '',
    'Last Purchase Rate (₹)': primaryProduct.lastPurchaseRate || '',
    'Rate Validity': primaryProduct.rateValidity || '',
    'Payment Terms': formData.paymentTerms || '',
    'Remarks': formData.remarks || ''
  };
};

// Function to map Google Sheets data to new form format
const mapSheetsDataToForm = (sheetsData) => {
  return {
    vendorCode: sheetsData['Vendor Code'] || '',
    vendorName: sheetsData['Vendor Name'] || '',
    businessType: sheetsData['Business Type'] || '',
    industry: sheetsData['Industry'] || '',
    category: sheetsData['Category'] || '',
    address: sheetsData['Address'] || '',
    city: sheetsData['City'] || '',
    state: sheetsData['State'] || '',
    stateCode: sheetsData['State Code'] || '',
    pincode: sheetsData['Pincode'] || '',
    country: sheetsData['Country'] || 'India',
    gstin: sheetsData['GSTIN'] || '',
    panNumber: sheetsData['PAN No.'] || '',
    accountCode: sheetsData['A/C Code'] || '',
    website: sheetsData['Website'] || '',
    contacts: [{
      name: sheetsData['Vendor Contact'] || '',
      email: sheetsData['Vendor Email'] || '',
      phone: sheetsData['Vendor Contact'] || '',
      department: sheetsData['Department'] || '',
      designation: sheetsData['Designation'] || '',
      isPrimary: true
    }],
    products: [{
      skuCode: sheetsData['SKU Code'] || '',
      skuDescription: sheetsData['SKU Description'] || '',
      category: sheetsData['Category'] || '',
      uom: sheetsData['UOM'] || '',
      moq: sheetsData['MOQ'] || '',
      leadTime: sheetsData['Lead Time (Days)'] || '',
      lastPurchaseRate: sheetsData['Last Purchase Rate (₹)'] || '',
      rateValidity: sheetsData['Rate Validity'] || '',
      alternateVendors: sheetsData['Alternate Vendors'] || ''
    }],
    paymentTerms: sheetsData['Payment Terms'] || '',
    creditLimit: sheetsData['Credit Limit'] || '',
    creditPeriod: sheetsData['Credit Period'] || '',
    deliveryTerms: sheetsData['Delivery Terms'] || '',
    rating: parseFloat(sheetsData['Rating']) || 0,
    totalOrders: parseInt(sheetsData['Total Orders']) || 0,
    totalValue: parseFloat(sheetsData['Total Value']) || 0,
    onTimeDelivery: parseFloat(sheetsData['On-Time Delivery']) || 0,
    qualityScore: parseFloat(sheetsData['Quality Score']) || 0,
    remarks: sheetsData['Remarks'] || '',
    status: sheetsData['Status'] || 'Active',
    lastContactDate: sheetsData['Last Contact Date'] || '',
    registrationDate: sheetsData['Registration Date'] || new Date().toISOString().slice(0, 10)
  };
};

const vendorService = {
    async getVendors() {
        try {
          const rows = await db.getTableRows(VENDOR_TABLE);
          if (!Array.isArray(rows) || rows.length === 0) return [];
      
          // Filter out rows without a Vendor Code and map to new format
          return rows
            .filter(row => !!row['Vendor Code'])
            .map(mapSheetsDataToForm);
        } catch (err) {
          console.error('Error in getVendors:', err);
          throw err;
        }
      },

  async addVendor(vendor) {
    if (Array.isArray(vendor)) {
      throw new Error('Vendor must be an object with header keys, not an array');
    }
    
    // Map the new form data to the old Google Sheets format
    const mappedVendor = mapFormDataToSheets(vendor);
    
    await db.insertTableRow(VENDOR_TABLE, mappedVendor);
    return true;
  },

  async updateVendor(vendorCode, updatedVendor) {
    const data = await db.getTableRows(VENDOR_TABLE);
    const mappedUpdatedVendor = mapFormDataToSheets(updatedVendor);

    for (const row of data) {
      if (row['Vendor Code'] === vendorCode && row.id) {
        const updatedRow = { ...row, ...mappedUpdatedVendor };
        delete updatedRow.id;
        await db.updateTableRowById(VENDOR_TABLE, row.id, updatedRow);
        return true;
      }
    }
    throw new Error('Vendor not found');
  },

  async deleteVendor(vendorCode) {
    const data = await db.getTableRows(VENDOR_TABLE);
    const toDelete = data.filter(row => row['Vendor Code'] === vendorCode && row.id);

    if (toDelete.length === 0) {
      throw new Error(`Vendor with code "${vendorCode}" not found`);
    }

    for (const row of toDelete) {
      await db.deleteTableRowById(VENDOR_TABLE, row.id);
    }
    return true;
  }
  
};

export default vendorService; 
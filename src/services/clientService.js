import * as db from '../lib/db';
import config from '../config/config';
import { parseJsonArray } from '../utils/parseJsonField';
import { sheetInt, sheetFloat } from '../utils/sheetNumbers';
import { supabase } from '../lib/supabaseClient';

/**
 * CLIENTS TABLE FIX: Centralized Table Mapping
 * Physical database: public.clients2
 * Logical name: CLIENT or clients (both resolve to clients2)
 * This ensures all client operations use the correct table.
 */
const TABLE_MAPPINGS = {
  clients: 'clients2',        // Logical → Physical mapping
  CLIENT: 'clients2',         // Config key → Physical
};

/** Logical key from config → resolved via db.TABLE_NAMES / getTableName (must match public.clients2). */
const CLIENTS_LOGICAL = config.sheets.clients;  // Should be 'CLIENT'
const CLIENTS_TABLE = db.getTableName(CLIENTS_LOGICAL) || 'clients2';

console.log('[clientService] STARTUP - Clients table resolution', {
  'config.sheets.clients': CLIENTS_LOGICAL,
  'db.getTableName()': db.getTableName(CLIENTS_LOGICAL),
  'FINAL TABLE NAME': CLIENTS_TABLE,
  'TABLE_MAPPINGS': TABLE_MAPPINGS,
  'EXPECTED phyisical': 'public.clients2',
  timestamp: new Date().toISOString(),
});

if (CLIENTS_TABLE !== 'clients2') {
  console.error(
    '[clientService] WARNING: Expected physical table "clients2" (public.clients2). Adjust db.TABLE_NAMES CLIENT/clients if your table name differs. Attempting to use mapped table anyway...',
    { resolved: CLIENTS_TABLE }
  );
}

// Generate unique client code sequentially (C + 5 digits, e.g., C00001)
export async function generateSequentialClientCode() {
  const data = await db.getTableRows(CLIENTS_TABLE).catch(() => []);
  const max = data.reduce((acc, row) => {
    const code = row.ClientCode || '';
    const match = code.match(/^C(\d{5})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > acc ? num : acc;
    }
    return acc;
  }, 0);
  const next = (max + 1).toString().padStart(5, '0');
  return `C${next}`;
}

function parseClientRow(row, header) {
  const obj = {};
  header.forEach((h, i) => {
    obj[h] = row[i] || '';
  });
  obj.contacts = obj.Contacts ? JSON.parse(obj.Contacts) : [];
  obj.products = obj.Products ? JSON.parse(obj.Products) : [];
  // Normalize keys for frontend
  obj.clientName = obj.ClientName;
  obj.clientCode = obj.ClientCode;
  obj.address = obj.Address;
  return obj;
}

function getSupabaseRowId(client) {
  return client && typeof client === 'object' ? client.id : client;
}

export async function checkClientCodeExists(clientCode) {
  const data = await db.getTableRows(CLIENTS_TABLE);
  return data.some(row => row.ClientCode === clientCode);
}

export async function getAllClients(forceRefresh = false) {
  try {
    console.log("[getAllClients] START", { forceRefresh, table: CLIENTS_TABLE });

    const data = await db.getTableRows(CLIENTS_TABLE);

    console.log("[getAllClients] RAW DATA:", data);

    const rows = Array.isArray(data) ? data : [];
    const sampleRow = rows[0] || null;
    console.log("[getAllClients] DATA STRUCTURE", {
      table: CLIENTS_TABLE,
      rowCount: rows.length,
      sampleKeys: sampleRow ? Object.keys(sampleRow) : [],
      sampleRowId: sampleRow?.id || null,
      sampleClientCode: sampleRow?.ClientCode || null,
    });

    const mapped = rows.map((row) => ({
      ...row,
      // Basic Information
      clientName: row.ClientName || '',
      clientCode: row.ClientCode || '',
      businessType: row.BusinessType || '',

      // Contact Information
      address: row.Address || '',
      city: row.City || '',
      state: row.State || '',
      stateCode: row.StateCode || '',
      pincode: row.Pincode || '',
      country: row.Country || 'India',

      // Business Details
      gstin: row.GSTIN || '',
      panNumber: row.PANNumber || '',
      accountCode: row.AccountCode || '',
      website: row.Website || '',

      // Contact Management
      contacts: parseJsonArray(row.Contacts),

      // Business Terms
      paymentTerms: row.PaymentTerms || '',
      creditLimit: row.CreditLimit || '',
      creditPeriod: row.CreditPeriod || '',
      deliveryTerms: row.DeliveryTerms || '',

      // Product Information
      products: parseJsonArray(row.Products),

      // Additional Information
      notes: row.Notes || '',
      status: row.Status || 'Active',
      rating: parseInt(row.Rating, 10) || 0,
      lastContactDate: row.LastContactDate || '',
      totalOrders: parseInt(row.TotalOrders, 10) || 0,
      totalValue: parseFloat(row.TotalValue) || 0,
    }));

    console.log("[getAllClients] SUCCESS", { count: mapped.length });
    return mapped;
  } catch (error) {
    console.error("[getAllClients] ERROR:", error);
    throw error;
  }
}

export async function addClient(client) {
  console.log("[addClient] Starting add operation", { clientCode: client.clientCode });
  
  try {
    // Check if client code already exists
    if (client.clientCode && await checkClientCodeExists(client.clientCode)) {
      throw new Error('Client code already exists. Please use a different client code.');
    }
    
    const row = {
      // Basic Information
      ClientName: client.clientName || '',
      ClientCode: client.clientCode || '',
      BusinessType: client.businessType || '',
      
      // Contact Information
      Address: client.address || '',
      City: client.city || '',
      State: client.state || '',
      StateCode: client.stateCode || '',
      Pincode: client.pincode || '',
      Country: client.country || 'India',
      
      // Business Details
      GSTIN: client.gstin || '',
      PANNumber: client.panNumber || '',
      AccountCode: client.accountCode || '',
      Website: client.website || '',
      
      // Contact Management
      Contacts: JSON.stringify(client.contacts || []),
      
      // Business Terms
      PaymentTerms: client.paymentTerms || '',
      CreditLimit: sheetFloat(client.creditLimit, 0),
      CreditPeriod: sheetInt(client.creditPeriod, 0),
      DeliveryTerms: client.deliveryTerms || '',
      
      // Product Information
      Products: JSON.stringify(client.products || []),
      
      // Additional Information
      Notes: client.notes || '',
      Status: client.status || 'Active',
      Rating: sheetInt(client.rating, 0),
      LastContactDate: client.lastContactDate || '',
      TotalOrders: sheetInt(client.totalOrders, 0),
      TotalValue: sheetFloat(client.totalValue, 0)
    };
    
    console.log("[addClient] Inserting client row", { rowKeys: Object.keys(row) });
    await db.insertTableRow(CLIENTS_TABLE, row);
    console.log("[addClient] ✅ SUCCESS: Client added", { clientCode: client.clientCode });
  } catch (error) {
    console.error("[addClient] ❌ ERROR:", error.message, error);
    throw error;
  }
}

export async function updateClient(client, originalClientCode = null, originalClientId = null) {
  const selectedClientId = originalClientId || getSupabaseRowId(client);
  console.log("[updateClient] Starting update operation", {
    selectedClientId,
    clientCode: client.clientCode,
    originalCode: originalClientCode,
  });
  
  try {
    // Check if the new client code already exists (and it's not the same as the original)
    if (client.clientCode && originalClientCode && client.clientCode !== originalClientCode) {
      if (await checkClientCodeExists(client.clientCode)) {
        throw new Error('Client code already exists. Please use a different client code.');
      }
    }
    
    let clientId = selectedClientId;
    if (!clientId) {
      const data = await db.getTableRows(CLIENTS_TABLE);
      const searchCode = originalClientCode || client.clientCode;
      console.log('Update requested id:', clientId);
      console.log('Actual row ids:', data.map(c => c.id));
      const existing = data.find(row => row.ClientCode === searchCode);
      if (!existing?.id) throw new Error('Client not found');
      clientId = existing.id;
    }
    
    const row = {
      // Basic Information
      ClientName: client.clientName || '',
      ClientCode: client.clientCode || '',
      BusinessType: client.businessType || '',
      
      // Contact Information
      Address: client.address || '',
      City: client.city || '',
      State: client.state || '',
      StateCode: client.stateCode || '',
      Pincode: client.pincode || '',
      Country: client.country || 'India',
      
      // Business Details
      GSTIN: client.gstin || '',
      PANNumber: client.panNumber || '',
      AccountCode: client.accountCode || '',
      Website: client.website || '',
      
      // Contact Management
      Contacts: JSON.stringify(client.contacts || []),
      
      // Business Terms
      PaymentTerms: client.paymentTerms || '',
      CreditLimit: sheetFloat(client.creditLimit, 0),
      CreditPeriod: sheetInt(client.creditPeriod, 0),
      DeliveryTerms: client.deliveryTerms || '',
      
      // Product Information
      Products: JSON.stringify(client.products || []),
      
      // Additional Information
      Notes: client.notes || '',
      Status: client.status || 'Active',
      Rating: sheetInt(client.rating, 0),
      LastContactDate: client.lastContactDate || '',
      TotalOrders: sheetInt(client.totalOrders, 0),
      TotalValue: sheetFloat(client.totalValue, 0)
    };
    
    console.log("[updateClient] Updating client", { id: clientId, rowKeys: Object.keys(row) });
    await db.updateTableRowById(CLIENTS_TABLE, clientId, row);
    console.log("[updateClient] ✅ SUCCESS: Client updated", { clientCode: client.clientCode });
  } catch (error) {
    console.error("[updateClient] ❌ ERROR:", error.message, error);
    throw error;
  }
}

export async function deleteClient(clientId) {
  console.log("[deleteClient] Starting delete operation", { clientId });
  console.log('Delete requested id:', clientId);
  
  try {
    if (!clientId) throw new Error('Client not found');
    
    console.log("[deleteClient] Deleting client", { id: clientId });
    const { error } = await supabase
      .from('clients2')
      .delete()
      .eq('id', clientId);

    if (error) throw error;

    console.log("[deleteClient] ✅ SUCCESS: Client deleted", { id: clientId });
  } catch (error) {
    console.error("[deleteClient] ❌ ERROR:", error.message, error);
    throw error;
  }
}

// Get all unique products from all clients
export async function getAllProductsFromClients(forceRefresh = false) {
  try {
    const clients = await getAllClients(forceRefresh);
    const productMap = new Map(); // Use Map to ensure uniqueness by productCode
    
    for (const client of clients) {

      if (client.products && Array.isArray(client.products)) {
        client.products.forEach((product, index) => {
          if (product.productCode) {
            // If product code already exists, keep the first occurrence
            if (!productMap.has(product.productCode)) {
              productMap.set(product.productCode, {
                productCode: product.productCode,
                productName: product.productName || '',
                category: product.category || '',
                description: product.description || '',
                // Technical specifications
                conductorSize: product.conductorSize || '',
                strandCount: product.strandCount || '',
                numberOfCore: product.numberOfCore || '',
                coreColors: product.coreColors || [],
                // Also include the colour field directly
                colour: product.colour || '',
                coreOD: product.coreOD || '',
                corePVC: product.corePVC || '',
                sheathOD: product.sheathOD || '',
                sheathInnerPVC: product.sheathInnerPVC || '',
                sheathOuterPVC: product.sheathOuterPVC || '',
                printingMaterial: product.printingMaterial || '',
                totalLength: product.totalLength || '',
                colour: product.colour || '',
                // Stock-related fields
                currentStock: product.currentStock || '',
                minLevel: product.minLevel || '',
                maxLevel: product.maxLevel || '',
                reorderPoint: product.reorderPoint || '',
                unit: product.unit || '',
                location: product.location || '',
                lastUpdated: product.lastUpdated || '',
                status: product.status || 'Active',
                clientCode: client.clientCode,
                clientName: client.clientName,
                // Store reference to client for traceability
                sourceClient: {
                  clientCode: client.clientCode,
                  clientName: client.clientName
                }
              });
            } else {
            }
          } else {
          }
        });
      } else {
      }
    }
    
    // Convert Map to array and sort by product code
    const result = Array.from(productMap.values()).sort((a, b) => 
      a.productCode.localeCompare(b.productCode)
    );

    return result;
  } catch (error) {
    console.error('=== GET ALL PRODUCTS FROM CLIENTS ERROR ===');
    console.error('Error getting products from clients:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Create a new client from sales flow data
export async function createClientFromSalesFlow(salesFlowData, leadDetails) {
  try {
    // Generate unique client code sequentially
    const clientCode = await generateSequentialClientCode();
    
    // Extract contact information from lead details
    const contacts = [];
    if (leadDetails?.ContactPerson) {
      contacts.push({
        name: leadDetails.ContactPerson,
        email: leadDetails.EmailId || salesFlowData.Email,
        number: leadDetails.MobileNumber || salesFlowData.PhoneNumber,
        department: leadDetails.Department || 'General'
      });
    }
    
    // Extract products interested
    const products = [];
    if (leadDetails?.ProductsInterested) {
      try {
        const productsInterested = typeof leadDetails.ProductsInterested === 'string' 
          ? JSON.parse(leadDetails.ProductsInterested) 
          : leadDetails.ProductsInterested;
        
        if (Array.isArray(productsInterested)) {
          productsInterested.forEach(product => {
            // Handle both object format and string format
            if (typeof product === 'object' && (product.productCode || product.ProductCode)) {
              products.push({
                productCode: product.productCode || product.ProductCode
              });
            } else if (typeof product === 'string') {
              products.push({
                productCode: product
              });
            }
          });
        }
      } catch (err) {
        console.error('Error parsing products interested:', err);
      }
    }
    
    // Create client object
    const client = {
      clientName: leadDetails?.CompanyName || salesFlowData.CompanyName || salesFlowData.FullName,
      clientCode: clientCode,
      address: leadDetails?.CustomerLocation || salesFlowData.CustomerLocation || '',
      contacts: contacts,
      products: products
    };
    
    // Add to CLIENT sheet
    await addClient(client);
    
    return {
      success: true,
      client: client,
      message: 'Client created successfully'
    };
  } catch (error) {
    console.error('Error creating client from sales flow:', error);
    throw error;
  }
}

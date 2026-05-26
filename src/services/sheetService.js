/**
 * Facade over db.js for backward compatibility. Uses Supabase tables directly;
 * no sheet_rows or sheet_name. All methods delegate to db.
 */
import * as db from '../lib/db';

function table(name) {
  return db.getTableName(name) || name;
}

async function getSheetData(sheetName) {
  if (!sheetName) throw new Error('Table name is required');
  if (sheetName === 'SendQuotation') {
    return db.getSendQuotationRows();
  }
  return db.getTableRows(table(sheetName));
}

async function getSheetHeaders(sheetName) {
  return db.getTableHeaders(table(sheetName));
}

async function appendRow(sheetName, rowData) {
  if (!sheetName) throw new Error('Table name is required');
  const payload = typeof rowData === 'object' && rowData !== null && !Array.isArray(rowData)
    ? rowData
    : Array.isArray(rowData)
      ? Object.fromEntries(rowData.map((h, i) => [h, '']))
      : {};
  await db.insertTableRow(table(sheetName), payload);
}

async function updateRow(sheetName, rowIndex, rowData) {
  if (!sheetName) throw new Error('Table name is required');
  await db.updateRowByIndex(table(sheetName), rowIndex, rowData);
}

async function deleteRow(sheetName, rowIndex) {
  if (!sheetName) throw new Error('Table name is required');
  await db.deleteRowByIndex(table(sheetName), rowIndex);
}

async function uploadFile(file, folderId = null) {
  return db.uploadFile(file, folderId);
}

export default {
  getSheetData,
  getSheetHeaders,
  appendRow,
  updateRow,
  deleteRow,
  uploadFile,
  init: async () => true,
  getLatestDispatchLimitRange: (sheetName = 'Daily_CAPACITY', forDate = new Date()) =>
    db.getLatestDispatchLimitRange(table(sheetName), forDate),
  getStockItems: () => getSheetData('Stock'),
  createSheetIfNotExists: async () => ({ success: true }),
  doesSheetExist: async (sheetName) => {
    await getSheetData(sheetName);
    return true;
  },
  createSheet: async () => ({}),
  initializeAllSheets: async () => [],
  updateSheetData: updateRow,
  batchUpdate: async (sheetName, updates) => {
    for (const u of updates) await updateRow(sheetName, u.rowIndex, u.data);
  },
  batchAppendRows: async (sheetName, rows) => {
    await db.batchInsertTableRows(table(sheetName), rows || []);
    return { success: true };
  },
  appendToSheet: async (sheetName, rows) => {
    await db.batchInsertTableRows(table(sheetName), rows || []);
  },
  clearCache: () => {},
  invalidateCache: () => {},
  updateCacheWithNewRow: () => {},
  updateCacheWithModifiedRow: () => {},
  removeRowFromCache: () => {},
  getOrCreateFolder: async () => null,
  clearSheet: async () => ({ success: true }),
};

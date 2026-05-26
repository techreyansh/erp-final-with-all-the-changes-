/**
 * Inventory data access (Material Inward, Material Issue, Stock, BOM, Kitting, Finished Goods).
 * Backed by Supabase tables via db; same API as before.
 */
import * as db from '../lib/db';

const STOCK_TABLE = 'stock';
const MATERIAL_INWARD_TABLE = 'material_inward';
const MATERIAL_ISSUE_TABLE = 'material_issue';
const BOM_TABLE = 'bom';
const KITTING_SHEET_TABLE = 'kitting_sheet';
const FINISHED_GOODS_TABLE = 'finished_goods';

const findStockItem = async (itemCode) => {
  const rows = await db.getTableRows(STOCK_TABLE);
  return rows.find((r) => (r.itemCode || r['Item Code']) === itemCode) || null;
};

const updateStockQuantity = async (itemCode, quantity, isInward = true) => {
  const rows = await db.getTableRows(STOCK_TABLE);
  const row = rows.find((r) => (r.itemCode || r['Item Code']) === itemCode);
  if (!row || !row.id) throw new Error(`Stock item ${itemCode} not found`);

  const currentStock = parseFloat(row.currentStock || row['Current Stock'] || 0) || 0;
  const qty = parseFloat(quantity) || 0;
  const newStock = isInward ? currentStock + qty : currentStock - qty;

  const record = { ...row };
  delete record.id;
  record.currentStock = newStock;
  record.lastUpdated = new Date().toISOString().split('T')[0];
  await db.updateTableRowById(STOCK_TABLE, row.id, record);
  return true;
};

function rowIndexToId(tableName, rowIndex) {
  return db.getTableRows(tableName).then((rows) => {
    const dataIndex = rowIndex - 2;
    const row = rows[dataIndex];
    if (!row || !row.id) throw new Error(`Row at index ${rowIndex} not found`);
    return row.id;
  });
}

export const MaterialInward = {
  getAll: async () => db.getTableRows(MATERIAL_INWARD_TABLE),
  add: async (data) => {
    const itemCode = data.itemCode || data['Item Code'];
    const quantity = data.quantity || data.Quantity;
    await db.insertTableRow(MATERIAL_INWARD_TABLE, data);
    await updateStockQuantity(itemCode, quantity, true);
    return true;
  },
  update: async (rowIndex, data, oldData) => {
    if (oldData && (oldData.itemCode || oldData['Item Code']) === (data.itemCode || data['Item Code'])) {
      const quantityDiff = parseFloat(data.quantity || data.Quantity || 0) - parseFloat(oldData.quantity || oldData.Quantity || 0);
      await updateStockQuantity(data.itemCode || data['Item Code'], Math.abs(quantityDiff), quantityDiff > 0);
    } else {
      if (oldData) await updateStockQuantity(oldData.itemCode || oldData['Item Code'], oldData.quantity || oldData.Quantity || 0, false);
      await updateStockQuantity(data.itemCode || data['Item Code'], data.quantity || data.Quantity || 0, true);
    }
    const id = await rowIndexToId(MATERIAL_INWARD_TABLE, rowIndex);
    await db.updateTableRowById(MATERIAL_INWARD_TABLE, id, data);
  },
  delete: async (rowIndex, data) => {
    await updateStockQuantity(data.itemCode || data['Item Code'], data.quantity || data.Quantity || 0, false);
    const id = await rowIndexToId(MATERIAL_INWARD_TABLE, rowIndex);
    await db.deleteTableRowById(MATERIAL_INWARD_TABLE, id);
  },
};

export const MaterialIssue = {
  getAll: async () => db.getTableRows(MATERIAL_ISSUE_TABLE),
  add: async (data) => {
    await db.insertTableRow(MATERIAL_ISSUE_TABLE, data);
    await updateStockQuantity(data.itemCode || data['Item Code'], data.quantity || data.Quantity || 0, false);
    return true;
  },
  update: async (rowIndex, data, oldData) => {
    if (oldData && (oldData.itemCode || oldData['Item Code']) === (data.itemCode || data['Item Code'])) {
      const quantityDiff = parseFloat(data.quantity || data.Quantity || 0) - parseFloat(oldData.quantity || oldData.Quantity || 0);
      await updateStockQuantity(data.itemCode || data['Item Code'], Math.abs(quantityDiff), quantityDiff < 0);
    } else {
      if (oldData) await updateStockQuantity(oldData.itemCode || oldData['Item Code'], oldData.quantity || oldData.Quantity || 0, true);
      await updateStockQuantity(data.itemCode || data['Item Code'], data.quantity || data.Quantity || 0, false);
    }
    const id = await rowIndexToId(MATERIAL_ISSUE_TABLE, rowIndex);
    await db.updateTableRowById(MATERIAL_ISSUE_TABLE, id, data);
  },
  delete: async (rowIndex, data) => {
    await updateStockQuantity(data.itemCode || data['Item Code'], data.quantity || data.Quantity || 0, true);
    const id = await rowIndexToId(MATERIAL_ISSUE_TABLE, rowIndex);
    await db.deleteTableRowById(MATERIAL_ISSUE_TABLE, id);
  },
};

export const Stock = {
  getAll: async () => db.getTableRows(STOCK_TABLE),
  add: async (data) => db.insertTableRow(STOCK_TABLE, data),
  update: async (rowIndex, data) => {
    const id = await rowIndexToId(STOCK_TABLE, rowIndex);
    await db.updateTableRowById(STOCK_TABLE, id, data);
  },
  delete: async (rowIndex) => {
    const id = await rowIndexToId(STOCK_TABLE, rowIndex);
    await db.deleteTableRowById(STOCK_TABLE, id);
  },
  findByItemCode: async (itemCode) => findStockItem(itemCode),
};

export const BOM = {
  getAll: async () => db.getTableRows(BOM_TABLE),
  add: async (data) => db.insertTableRow(BOM_TABLE, data),
  update: async (rowIndex, data) => {
    const id = await rowIndexToId(BOM_TABLE, rowIndex);
    await db.updateTableRowById(BOM_TABLE, id, data);
  },
  delete: async (rowIndex) => {
    const id = await rowIndexToId(BOM_TABLE, rowIndex);
    await db.deleteTableRowById(BOM_TABLE, id);
  },
};

export const KittingSheet = {
  getAll: async () => db.getTableRows(KITTING_SHEET_TABLE),
  add: async (data) => db.insertTableRow(KITTING_SHEET_TABLE, data),
  update: async (rowIndex, data) => {
    const id = await rowIndexToId(KITTING_SHEET_TABLE, rowIndex);
    await db.updateTableRowById(KITTING_SHEET_TABLE, id, data);
  },
  delete: async (rowIndex) => {
    const id = await rowIndexToId(KITTING_SHEET_TABLE, rowIndex);
    await db.deleteTableRowById(KITTING_SHEET_TABLE, id);
  },
};

export const FinishedGoods = {
  getAll: async () => db.getTableRows(FINISHED_GOODS_TABLE),
  add: async (data) => db.insertTableRow(FINISHED_GOODS_TABLE, data),
  update: async (rowIndex, data) => {
    const id = await rowIndexToId(FINISHED_GOODS_TABLE, rowIndex);
    await db.updateTableRowById(FINISHED_GOODS_TABLE, id, data);
  },
  delete: async (rowIndex) => {
    const id = await rowIndexToId(FINISHED_GOODS_TABLE, rowIndex);
    await db.deleteTableRowById(FINISHED_GOODS_TABLE, id);
  },
};

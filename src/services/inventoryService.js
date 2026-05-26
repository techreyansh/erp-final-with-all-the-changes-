import { supabase } from '../lib/supabaseClient';

const STOCK_TABLE = 'inventory_stock';
const RPC_UPDATE_INVENTORY = 'update_inventory_transaction';

function requireId(value, label) {
  if (value == null || String(value).trim() === '') {
    const err = new Error(`${label} is required`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

function handleError(operation, context, error) {
  const message = error?.message || 'Unknown error';
  const code = error?.code;
  console.error(`[inventoryService] ${operation} failed:`, { context, code, message });
  const err = new Error(message);
  err.code = code;
  err.details = error?.details;
  throw err;
}

/**
 * Get inventory (current stock) for a branch. Returns all product rows with quantities for the branch.
 * @param {string} branch_id - Branch UUID
 * @returns {Promise<Array<{ branchId: string, productId: string, quantity: number, updatedAt: string, product?: object }>>}
 */
export async function getInventoryByBranch(branch_id) {
  requireId(branch_id, 'branch_id');

  try {
    const { data, error } = await supabase
      .from(STOCK_TABLE)
      .select(
        'branch_id, product_id, quantity, updated_at, products(id, name, code, description, unit_of_measure_id, units_of_measure(id, code, name, symbol))'
      )
      .eq('branch_id', branch_id)
      .order('product_id', { ascending: true });

    if (error) handleError('getInventoryByBranch', { branch_id }, error);

    return (data || []).map((row) => {
      const p = row.products;
      return {
        branchId: row.branch_id,
        productId: row.product_id,
        quantity: Number(row.quantity),
        updatedAt: row.updated_at,
        product: p
          ? {
              id: p.id,
              name: p.name,
              code: p.code,
              description: p.description,
              unitOfMeasureId: p.unit_of_measure_id,
              unitOfMeasure: p.units_of_measure
                ? {
                    id: p.units_of_measure.id,
                    code: p.units_of_measure.code,
                    name: p.units_of_measure.name,
                    symbol: p.units_of_measure.symbol,
                  }
                : null,
            }
          : undefined,
      };
    });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('getInventoryByBranch', { branch_id }, err);
  }
}

/**
 * Get stock for a product across branches (or single-branch view). Returns rows per branch.
 * @param {string} product_id - Product UUID
 * @returns {Promise<Array<{ branchId: string, productId: string, quantity: number, updatedAt: string }>>}
 */
export async function getStockByProduct(product_id) {
  requireId(product_id, 'product_id');

  try {
    const { data, error } = await supabase
      .from(STOCK_TABLE)
      .select('branch_id, product_id, quantity, updated_at')
      .eq('product_id', product_id)
      .order('branch_id', { ascending: true });

    if (error) handleError('getStockByProduct', { product_id }, error);

    return (data || []).map((row) => ({
      branchId: row.branch_id,
      productId: row.product_id,
      quantity: Number(row.quantity),
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('getStockByProduct', { product_id }, err);
  }
}

/**
 * Record an inventory transaction and update stock via RPC. Do NOT update inventory_stock directly.
 * @param {object} params
 * @param {string} params.branch_id - Branch UUID
 * @param {string} params.product_id - Product UUID
 * @param {number} params.quantity_delta - Change in quantity (positive = in, negative = out)
 * @param {string} [params.transaction_type] - e.g. 'in', 'out', 'adjustment', 'transfer'
 * @param {string} [params.reference_id] - Optional reference (e.g. order id, transfer id)
 * @param {string} [params.notes] - Optional notes
 * @returns {Promise<{ transactionId: string, branchId: string, productId: string, previousQuantity: number, quantityDelta: number, newQuantity: number }>}
 */
export async function updateInventoryTransaction(params) {
  if (!params || typeof params !== 'object') {
    const err = new Error('Params object is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const {
    branch_id,
    product_id,
    quantity_delta,
    transaction_type = 'adjustment',
    reference_id = null,
    notes = null,
  } = params;

  requireId(branch_id, 'branch_id');
  requireId(product_id, 'product_id');
  if (quantity_delta == null || Number(quantity_delta) !== Number(quantity_delta)) {
    const err = new Error('quantity_delta must be a number');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  try {
    const { data, error } = await supabase.rpc(RPC_UPDATE_INVENTORY, {
      p_branch_id: branch_id,
      p_product_id: product_id,
      p_quantity_delta: Number(quantity_delta),
      p_transaction_type: transaction_type || 'adjustment',
      p_reference_id: reference_id ?? null,
      p_notes: notes ?? null,
    });

    if (error) handleError('updateInventoryTransaction', { branch_id, product_id }, error);

    return {
      transactionId: data?.transaction_id,
      branchId: data?.branch_id,
      productId: data?.product_id,
      previousQuantity: Number(data?.previous_quantity ?? 0),
      quantityDelta: Number(data?.quantity_delta ?? 0),
      newQuantity: Number(data?.new_quantity ?? 0),
    };
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('updateInventoryTransaction', { branch_id, product_id }, err);
  }
}

export default {
  getInventoryByBranch,
  getStockByProduct,
  updateInventoryTransaction,
};

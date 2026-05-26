import { supabase } from '../lib/supabaseClient';

const TABLE = 'purchase_orders';

/**
 * Get all purchase orders that are not soft-deleted.
 * @returns {Promise<Array<{ id: string, ...record }>>}
 */
export async function getPurchaseOrders() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, created_at, updated_at, deleted_at, sort_order, record')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getPurchaseOrders error:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    sortOrder: row.sort_order,
    ...(row.record || {}),
  }));
}

/**
 * Get a single purchase order by id. Excludes soft-deleted by default.
 * @param {string} id - UUID
 * @param {{ includeDeleted?: boolean }} options
 * @returns {Promise<{ id: string, ...record } | null>}
 */
export async function getPurchaseOrderById(id, options = {}) {
  if (!id) {
    throw new Error('Purchase order id is required');
  }

  let query = supabase
    .from(TABLE)
    .select('id, created_at, updated_at, deleted_at, sort_order, record')
    .eq('id', id);

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('getPurchaseOrderById error:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    sortOrder: data.sort_order,
    ...(data.record || {}),
  };
}

/**
 * Create a new purchase order.
 * @param {object} data - Purchase order fields (stored in record)
 * @returns {Promise<{ id: string, ...record }>}
 */
export async function createPurchaseOrder(data) {
  const record = data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({
      record,
      sort_order: 0,
    })
    .select('id, created_at, updated_at, sort_order, record')
    .single();

  if (error) {
    console.error('createPurchaseOrder error:', error);
    throw error;
  }

  return {
    id: inserted.id,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
    sortOrder: inserted.sort_order,
    ...(inserted.record || {}),
  };
}

/**
 * Update an existing purchase order. Merges data into existing record. Does not update soft-deleted rows.
 * @param {string} id - UUID
 * @param {object} data - Fields to merge into record
 * @returns {Promise<{ id: string, ...record }>}
 */
export async function updatePurchaseOrder(id, data) {
  if (!id) {
    throw new Error('Purchase order id is required');
  }

  const existing = await getPurchaseOrderById(id);
  if (!existing) {
    throw new Error('Purchase order not found or deleted');
  }

  const { id: _id, createdAt, updatedAt, deletedAt, sortOrder, ...currentRecord } = existing;
  const updates = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const record = { ...currentRecord, ...updates };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({
      record,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, created_at, updated_at, sort_order, record')
    .single();

  if (error) {
    console.error('updatePurchaseOrder error:', error);
    throw error;
  }

  return {
    id: updated.id,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    sortOrder: updated.sort_order,
    ...(updated.record || {}),
  };
}

/**
 * Soft-delete a purchase order by setting deleted_at.
 * @param {string} id - UUID
 * @returns {Promise<void>}
 */
export async function softDeletePurchaseOrder(id) {
  if (!id) {
    throw new Error('Purchase order id is required');
  }

  const { error } = await supabase
    .from(TABLE)
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('softDeletePurchaseOrder error:', error);
    throw error;
  }
}

export default {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  softDeletePurchaseOrder,
};

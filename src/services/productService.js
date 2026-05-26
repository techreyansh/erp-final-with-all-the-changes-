import { supabase } from '../lib/supabaseClient';

const PRODUCTS_TABLE = 'products';
const CATEGORIES_TABLE = 'product_categories';
const UNITS_TABLE = 'units_of_measure';

const PRODUCT_SELECT =
  'id, created_at, updated_at, deleted_at, name, code, description, product_category_id, unit_of_measure_id, record, product_categories(id, name, slug, description), units_of_measure(id, code, name, symbol)';

function mapProductRow(row) {
  if (!row) return null;
  const { product_categories: category, units_of_measure: unit, ...rest } = row;
  return {
    id: rest.id,
    createdAt: rest.created_at,
    updatedAt: rest.updated_at,
    deletedAt: rest.deleted_at,
    name: rest.name,
    code: rest.code,
    description: rest.description,
    productCategoryId: rest.product_category_id,
    unitOfMeasureId: rest.unit_of_measure_id,
    record: rest.record || {},
    productCategory: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        }
      : null,
    unitOfMeasure: unit
      ? {
          id: unit.id,
          code: unit.code,
          name: unit.name,
          symbol: unit.symbol,
        }
      : null,
  };
}

function handleError(operation, context, error) {
  const message = error?.message || 'Unknown error';
  const code = error?.code;
  console.error(`[productService] ${operation} failed:`, { context, code, message });
  const err = new Error(message);
  err.code = code;
  err.details = error?.details;
  throw err;
}

function requireId(id, label = 'id') {
  if (id == null || String(id).trim() === '') {
    const err = new Error(`${label} is required`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

/**
 * Get all products that are not soft-deleted, with category and unit joined.
 * @returns {Promise<Array<object>>}
 */
export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select(PRODUCT_SELECT)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) handleError('getProducts', {}, error);
    return (data || []).map(mapProductRow);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('getProducts', {}, err);
  }
}

/**
 * Get a single product by id with category and unit joined.
 * @param {string} id - Product UUID
 * @param {{ includeDeleted?: boolean }} options
 * @returns {Promise<object | null>}
 */
export async function getProductById(id, options = {}) {
  requireId(id, 'Product id');

  try {
    let query = supabase
      .from(PRODUCTS_TABLE)
      .select(PRODUCT_SELECT)
      .eq('id', id);

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) handleError('getProductById', { id }, error);
    return mapProductRow(data);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('getProductById', { id }, err);
  }
}

/**
 * Create a new product.
 * @param {object} data - { name, code?, description?, productCategoryId?, unitOfMeasureId?, ...record }
 * @returns {Promise<object>}
 */
export async function createProduct(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Product data is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (!data.name || String(data.name).trim() === '') {
    const err = new Error('Product name is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const {
    name: nameVal,
    code: codeVal,
    description: descVal,
    productCategoryId: catId,
    unitOfMeasureId: unitId,
    record: recordVal = {},
    ...rest
  } = data;

  const payload = {
    name: String(nameVal).trim(),
    code: codeVal != null ? String(codeVal).trim() : null,
    description: descVal != null ? String(descVal).trim() : null,
    product_category_id: catId || data.product_category_id || null,
    unit_of_measure_id: unitId || data.unit_of_measure_id || null,
    record: { ...recordVal, ...rest },
  };

  try {
    const { data: inserted, error } = await supabase
      .from(PRODUCTS_TABLE)
      .insert(payload)
      .select(PRODUCT_SELECT)
      .single();

    if (error) handleError('createProduct', { name: payload.name }, error);
    return mapProductRow(inserted);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('createProduct', { name: payload.name }, err);
  }
}

/**
 * Update an existing product. Merges extra fields into record. Excludes soft-deleted.
 * @param {string} id - Product UUID
 * @param {object} data - Fields to update (name, code, description, productCategoryId, unitOfMeasureId, record merge)
 * @returns {Promise<object>}
 */
export async function updateProduct(id, data) {
  requireId(id, 'Product id');
  if (!data || typeof data !== 'object') {
    const err = new Error('Update data is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const existing = await getProductById(id);
  if (!existing) {
    const err = new Error('Product not found or deleted');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const payload = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) payload.name = String(data.name).trim();
  if (data.code !== undefined) payload.code = data.code == null ? null : String(data.code).trim();
  if (data.description !== undefined) payload.description = data.description == null ? null : String(data.description).trim();
  if (data.productCategoryId !== undefined) payload.product_category_id = data.productCategoryId || null;
  if (data.unitOfMeasureId !== undefined) payload.unit_of_measure_id = data.unitOfMeasureId || null;

  const record = { ...(existing.record || {}), ...(data.record || {}) };
  const { name, code, description, productCategoryId, unitOfMeasureId, record: _r, ...rest } = data;
  Object.keys(rest).forEach((key) => {
    if (!['id', 'createdAt', 'updatedAt', 'deletedAt', 'productCategory', 'unitOfMeasure'].includes(key)) {
      record[key] = rest[key];
    }
  });
  payload.record = record;

  try {
    const { data: updated, error } = await supabase
      .from(PRODUCTS_TABLE)
      .update(payload)
      .eq('id', id)
      .is('deleted_at', null)
      .select(PRODUCT_SELECT)
      .single();

    if (error) handleError('updateProduct', { id }, error);
    if (!updated) {
      const err = new Error('Product not found or deleted');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return mapProductRow(updated);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR' || err.code === 'NOT_FOUND') throw err;
    handleError('updateProduct', { id }, err);
  }
}

/**
 * Soft-delete a product (set deleted_at).
 * @param {string} id - Product UUID
 * @returns {Promise<void>}
 */
export async function softDeleteProduct(id) {
  requireId(id, 'Product id');

  try {
    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) handleError('softDeleteProduct', { id }, error);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') throw err;
    handleError('softDeleteProduct', { id }, err);
  }
}

/**
 * Get all product categories (not soft-deleted). For dropdowns.
 * @returns {Promise<Array<{ id, name, slug, description }>>}
 */
export async function getProductCategories() {
  try {
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .select('id, name, slug, description')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) handleError('getProductCategories', {}, error);
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
    }));
  } catch (err) {
    handleError('getProductCategories', {}, err);
  }
}

/**
 * Get all units of measure (not soft-deleted). For dropdowns.
 * @returns {Promise<Array<{ id, code, name, symbol }>>}
 */
export async function getUnitsOfMeasure() {
  try {
    const { data, error } = await supabase
      .from(UNITS_TABLE)
      .select('id, code, name, symbol')
      .is('deleted_at', null)
      .order('code', { ascending: true });

    if (error) handleError('getUnitsOfMeasure', {}, error);
    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      symbol: row.symbol,
    }));
  } catch (err) {
    handleError('getUnitsOfMeasure', {}, err);
  }
}

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  getProductCategories,
  getUnitsOfMeasure,
};

import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import type { Database, Json, SheetEntityRow, SheetEntityUpdate, SheetTableName } from '../../../types/supabase';
import {
  mapPostgrestError,
  type FlattenedSheetRow,
  type SheetResult,
} from './sheetEntityTypes';

type TableInsert = Database['public']['Tables'][SheetTableName]['Insert'];

const LEGACY_ERR_MARKERS = ['sort_order', 'record'];

function isLegacySchemaError(err: PostgrestError): boolean {
  const m = String(err.message || '').toLowerCase();
  return LEGACY_ERR_MARKERS.some((k) => m.includes(k));
}

function flattenRow(row: SheetEntityRow): FlattenedSheetRow {
  const rec = row.record;
  const flat =
    rec && typeof rec === 'object' && !Array.isArray(rec)
      ? (rec as Record<string, Json>)
      : {};
  return { id: row.id, ...flat };
}

/**
 * Typed CRUD for sheet-style tables (`id`, `created_at`, `sort_order`, `record`).
 * Dynamic `tableName` is typed as `SheetTableName`; Supabase chains use narrow casts for v2 client inference.
 */
export function createSheetEntityService(tableName: SheetTableName) {
  const from = () => supabase.from(tableName);

  return {
    tableName,

    async getAllRaw(): Promise<SheetResult<SheetEntityRow[]>> {
      const { data, error } = await from()
        .select('id, created_at, sort_order, record')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error) {
        return { ok: true, data: (data ?? []) as SheetEntityRow[] };
      }
      if (!isLegacySchemaError(error)) {
        return { ok: false, error: mapPostgrestError(error) };
      }

      const fallback = await from().select('*').order('created_at', { ascending: true });
      if (fallback.error) {
        return { ok: false, error: mapPostgrestError(fallback.error) };
      }
      return { ok: true, data: (fallback.data ?? []) as unknown as SheetEntityRow[] };
    },

    async getAllFlattened(): Promise<SheetResult<FlattenedSheetRow[]>> {
      const res = await this.getAllRaw();
      if (!res.ok) return res;
      return { ok: true, data: res.data.map(flattenRow) };
    },

    async getById(id: string): Promise<SheetResult<SheetEntityRow | null>> {
      const { data, error } = await from()
        .select('id, created_at, sort_order, record')
        .eq('id', id)
        .maybeSingle();

      if (!error) {
        return { ok: true, data: data as SheetEntityRow | null };
      }
      if (!isLegacySchemaError(error)) {
        return { ok: false, error: mapPostgrestError(error) };
      }

      const fb = await from().select('*').eq('id', id).maybeSingle();
      if (fb.error) return { ok: false, error: mapPostgrestError(fb.error) };
      return { ok: true, data: fb.data as unknown as SheetEntityRow | null };
    },

    async getByIdFlattened(id: string): Promise<SheetResult<FlattenedSheetRow | null>> {
      const res = await this.getById(id);
      if (!res.ok) return res;
      if (!res.data) return { ok: true, data: null };
      return { ok: true, data: flattenRow(res.data) };
    },

    async insertRecord(record: Record<string, Json>): Promise<SheetResult<{ id: string } | null>> {
      const { data: maxRow, error: maxErr } = await from()
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!maxErr) {
        const nextOrder = ((maxRow as { sort_order?: number } | null)?.sort_order ?? -1) + 1;
        const payload = { sort_order: nextOrder, record: record as Json } as TableInsert;
        const { data, error } = await from().insert(payload).select('id').maybeSingle();

        if (!error && data && typeof data === 'object' && 'id' in data) {
          return { ok: true, data: { id: String((data as { id: string }).id) } };
        }
        if (error && !isLegacySchemaError(error)) {
          return { ok: false, error: mapPostgrestError(error) };
        }
      } else if (!isLegacySchemaError(maxErr)) {
        return { ok: false, error: mapPostgrestError(maxErr) };
      }

      const { data, error } = await from()
        .insert(record as unknown as TableInsert)
        .select('id')
        .maybeSingle();
      if (error) return { ok: false, error: mapPostgrestError(error) };
      if (data && typeof data === 'object' && 'id' in data) {
        return { ok: true, data: { id: String((data as { id: string }).id) } };
      }
      return { ok: true, data: null };
    },

    async updateById(id: string, patch: SheetEntityUpdate): Promise<SheetResult<null>> {
      const { error } = await from().update(patch as never).eq('id', id);
      if (error) {
        if (!isLegacySchemaError(error)) {
          return { ok: false, error: mapPostgrestError(error) };
        }
        const fb = await from().update(patch as never).eq('id', id);
        if (fb.error) return { ok: false, error: mapPostgrestError(fb.error) };
        return { ok: true, data: null };
      }
      return { ok: true, data: null };
    },

    async updateRecordById(id: string, record: Record<string, Json>): Promise<SheetResult<null>> {
      return this.updateById(id, { record: record as Json });
    },

    async deleteById(id: string): Promise<SheetResult<null>> {
      const { error } = await from().delete().eq('id', id);
      if (error) return { ok: false, error: mapPostgrestError(error) };
      return { ok: true, data: null };
    },
  };
}

export type SheetEntityService = ReturnType<typeof createSheetEntityService>;

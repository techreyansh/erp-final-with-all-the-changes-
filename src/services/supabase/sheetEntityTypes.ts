import type { PostgrestError } from '@supabase/supabase-js';
import type { FlattenedSheetRow, Json, SheetEntityInsert, SheetEntityRow, SheetEntityUpdate, SheetTableName } from '../../../types/supabase';

export type SheetServiceError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  raw: PostgrestError;
};

export type SheetOk<T> = { ok: true; data: T };
export type SheetErr = { ok: false; error: SheetServiceError };
export type SheetResult<T> = SheetOk<T> | SheetErr;

export function mapPostgrestError(err: PostgrestError): SheetServiceError {
  return {
    message: err.message,
    code: err.code,
    details: err.details ?? undefined,
    hint: err.hint ?? undefined,
    raw: err,
  };
}

export type { FlattenedSheetRow, Json, SheetEntityInsert, SheetEntityRow, SheetEntityUpdate, SheetTableName };

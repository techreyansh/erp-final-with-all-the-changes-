import type { SheetTableName } from '../../../types/supabase';
import { SHEET_TABLE_NAMES } from '../../../types/supabase';
import { createSheetEntityService, type SheetEntityService } from './createSheetEntityService';

function buildRegistry(): Record<SheetTableName, SheetEntityService> {
  const acc = {} as Record<SheetTableName, SheetEntityService>;
  for (const name of SHEET_TABLE_NAMES) {
    acc[name] = createSheetEntityService(name);
  }
  return acc;
}

/** One service instance per sheet table — e.g. `sheetServices.audit_log.getAllFlattened()`. */
export const sheetServices = buildRegistry();

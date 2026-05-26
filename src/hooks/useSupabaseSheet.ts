import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSheetEntityService } from '../services/supabase/createSheetEntityService';
import type { FlattenedSheetRow, SheetTableName } from '../../types/supabase';
import type { SheetServiceError } from '../services/supabase/sheetEntityTypes';

type UseSupabaseSheetState = {
  rows: FlattenedSheetRow[];
  loading: boolean;
  error: SheetServiceError | null;
  refresh: () => Promise<void>;
  insertRow: (record: Record<string, import('../../types/supabase').Json>) => Promise<boolean>;
  updateRow: (id: string, record: Record<string, import('../../types/supabase').Json>) => Promise<boolean>;
  removeRow: (id: string) => Promise<boolean>;
};

/**
 * Generic hook for sheet-style Supabase tables (flattened rows like `db.getTableRows`).
 */
export function useSupabaseSheet(tableName: SheetTableName): UseSupabaseSheetState {
  const service = useMemo(() => createSheetEntityService(tableName), [tableName]);
  const [rows, setRows] = useState<FlattenedSheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SheetServiceError | null>(null);

  const refresh = useCallback(async () => {
    const dev = process.env.NODE_ENV === 'development';
    if (dev) {
      console.log('[useSupabaseSheet] refresh() start', { tableName });
    }
    setLoading(true);
    setError(null);
    const res = await service.getAllFlattened();
    if (dev) {
      console.log('[useSupabaseSheet] refresh() result', {
        tableName,
        ok: res.ok,
        rowCount: res.ok ? res.data.length : undefined,
        error: res.ok ? undefined : res.error,
      });
    }
    if (res.ok) {
      setRows(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [service, tableName]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useSupabaseSheet] mount / auto-refresh', { tableName });
    }
    void refresh();
  }, [refresh, tableName]);

  const insertRow = useCallback(
    async (record: Record<string, import('../../types/supabase').Json>) => {
      const res = await service.insertRecord(record);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      await refresh();
      return true;
    },
    [service, refresh]
  );

  const updateRow = useCallback(
    async (id: string, record: Record<string, import('../../types/supabase').Json>) => {
      const res = await service.updateRecordById(id, record);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      await refresh();
      return true;
    },
    [service, refresh]
  );

  const removeRow = useCallback(
    async (id: string) => {
      const res = await service.deleteById(id);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      await refresh();
      return true;
    },
    [service, refresh]
  );

  return { rows, loading, error, refresh, insertRow, updateRow, removeRow };
}

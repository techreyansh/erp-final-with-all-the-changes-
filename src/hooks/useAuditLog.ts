import { useSupabaseSheet } from './useSupabaseSheet';

/** Typed hook for `audit_log` rows (flattened). */
export function useAuditLog() {
  return useSupabaseSheet('audit_log');
}

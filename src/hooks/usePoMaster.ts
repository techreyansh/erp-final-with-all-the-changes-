import { useSupabaseSheet } from './useSupabaseSheet';

/** Typed hook for `po_master` rows (flattened). */
export function usePoMaster() {
  return useSupabaseSheet('po_master');
}

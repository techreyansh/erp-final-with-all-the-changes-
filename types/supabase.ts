/**
 * Database types for Supabase (sheet-style entities: id, created_at, sort_order, record jsonb).
 * Regenerate or extend when you add tables — keep SHEET_TABLE_NAMES in sync with migrations / db.js.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Raw row as stored in Postgres */
export type SheetEntityRow = {
  id: string;
  created_at: string;
  sort_order: number;
  record: Json;
};

export type SheetEntityInsert = {
  id?: string;
  created_at?: string;
  sort_order?: number;
  record?: Json;
};

export type SheetEntityUpdate = {
  sort_order?: number;
  record?: Json;
  created_at?: string;
};

/** All public tables that use the sheet entity shape (see src/lib/db.js TABLE_NAMES + extra modules). */
export const SHEET_TABLE_NAMES = [
  'users',
  'clients',
  'prospects_clients',
  'client_orders_data',
  'client_payments_data',
  'client_quotations_data',
  'client_notifications_data',
  'vendors_data',
  'stock_data',
  'material_inward_data',
  'material_issue_data',
  'company_bom_data',
  'company_material_issue_data',
  'finished_goods',
  'dispatches',
  'purchase_flow_data',
  'purchase_flow_steps_data',
  'sales_flow_data',
  'sales_flow_steps_data',
  'log_and_qualify_leads_data',
  'initial_call_data',
  'send_quotation_data',
  'approve_payment_terms_data',
  'sample_submission_data',
  'get_approval_for_sample_data',
  'approve_strategic_deals_data',
  'evaluate_high_value_prospects_data',
  'check_feasibility_data',
  'confirm_standard_and_compliance',
  'follow_up_quotations_data',
  'comparative_statement_data',
  'sheet_approve_quotation_data',
  'request_sample_data',
  'inspect_material_data',
  'material_approval',
  'place_po_data',
  'return_history_data',
  'generate_grn_data',
  'schedule_payment',
  'release_payment',
  'audit_log',
  'whatsapp_logs',
  'products',
  'po_master',
  'daily_capacity',
  'cable_products',
  'cable_production_plans',
  'machine_schedules',
  'rfq_data',
  'bom_templates',
  'sort_vendor_data',
  'follow_up_delivery_data',
  'return_material_data',
  'inspect_sample_data',
  'employees_data',
  'performance_data',
  'attendance_data',
  'employee_tasks_data',
  'notifications_data',
  'po_items',
  'fg_material_inward',
  'fg_material_outward',
  'power_cord_master',
  'production_monitoring',
  'mold_compatibility_matrix',
  'production_orders',
  'machine_status_log',
] as const;

export type SheetTableName = (typeof SHEET_TABLE_NAMES)[number];

type SheetTableDef = {
  Row: SheetEntityRow;
  Insert: SheetEntityInsert;
  Update: SheetEntityUpdate;
  Relationships: [];
};

export type PublicSheetTables = {
  [K in SheetTableName]: SheetTableDef;
};

export type Database = {
  public: {
    Tables: PublicSheetTables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** Flattened row like getTableRows() in db.js: { id, ...record } */
export type FlattenedSheetRow<TRecord extends Record<string, Json | undefined> = Record<string, Json>> = {
  id: string;
} & TRecord;

/**
 * RLS: ensure policies allow the operations your app needs for each table.
 * Typical dev pattern (not for production): FOR ALL USING (true) WITH CHECK (true) for anon/authenticated.
 * Production: scope by auth.uid(), role, or service role for server-side jobs only.
 */

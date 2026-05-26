-- Replace sheet_rows with real Supabase tables (one per entity).
-- Drops sheet_rows and creates entity tables with: id, created_at, sort_order, record jsonb.

DROP TABLE IF EXISTS public.sheet_rows;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.material_inward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.material_issue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.kitting_sheet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.finished_goods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.purchase_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.purchase_flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.sales_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.sales_flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.log_and_qualify_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.initial_call (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.send_quotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.approve_payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.sample_submission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.get_approval_for_sample (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.approve_strategic_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.evaluate_high_value_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.check_feasibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.confirm_standard_and_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.follow_up_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.comparative_statement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.sheet_approve_quotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.request_sample (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.inspect_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.material_approval (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.place_po (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.return_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.generate_grn (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.schedule_payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.release_payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.po_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.daily_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.rfq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.bom_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.sort_vendor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.follow_up_delivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.return_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.inspect_sample (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.prospects_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

-- RLS: enable and allow all for anon on each table
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users','clients','prospects_clients','vendors','stock','material_inward','material_issue','bom','kitting_sheet',
    'finished_goods','dispatches','purchase_flows','purchase_flow_steps','sales_flows','sales_flow_steps',
    'bom_templates','sort_vendor','follow_up_delivery','return_material','inspect_sample',
    'log_and_qualify_leads','initial_call','send_quotation','approve_payment_terms','sample_submission',
    'get_approval_for_sample','approve_strategic_deals','evaluate_high_value_prospects','check_feasibility',
    'confirm_standard_and_compliance','follow_up_quotations','comparative_statement','sheet_approve_quotation',
    'request_sample','inspect_material','material_approval','place_po','return_history','generate_grn',
    'schedule_payment','release_payment','audit_log','whatsapp_logs','products','po_master','daily_capacity','rfq'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all anon" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Allow all anon" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Keep storage bucket and policies (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow uploads for documents bucket" ON storage.objects;
CREATE POLICY "Allow uploads for documents bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public read for documents bucket" ON storage.objects;
CREATE POLICY "Allow public read for documents bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow update for documents bucket" ON storage.objects;
CREATE POLICY "Allow update for documents bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow delete for documents bucket" ON storage.objects;
CREATE POLICY "Allow delete for documents bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');

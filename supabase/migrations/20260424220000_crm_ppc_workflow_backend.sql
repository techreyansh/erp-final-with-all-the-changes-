-- CRM + PPC backend workflow foundation (normalized, id-linked, RLS-aware)
-- This migration is idempotent and reuses existing ERP entities:
-- users, customers, products, inventory, sales_orders, dispatches.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(r.code, 'UNKNOWN')
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role_code() IN ('CEO', 'ADMIN', 'SUPER_ADMIN')
$$;

-- ---------------------------------------------------------------------------
-- Reuse customers table: add CRM credit fields if missing
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overdue_days integer NOT NULL DEFAULT 0;

UPDATE public.customers
SET company_name = COALESCE(company_name, name)
WHERE company_name IS NULL;

-- ---------------------------------------------------------------------------
-- CRM entities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  source text,
  status text NOT NULL DEFAULT 'NEW',
  assigned_to uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  customer_id uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  budget_score integer NOT NULL DEFAULT 0 CHECK (budget_score BETWEEN 0 AND 20),
  requirement_clarity_score integer NOT NULL DEFAULT 0 CHECK (requirement_clarity_score BETWEEN 0 AND 20),
  urgency_score integer NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 20),
  engagement_score integer NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 20),
  decision_authority_score integer NOT NULL DEFAULT 0 CHECK (decision_authority_score BETWEEN 0 AND 20),
  won_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_customer_id ON public.crm_leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);

CREATE TABLE IF NOT EXISTS public.crm_activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  customer_id uuid NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('CALL','EMAIL','MEETING','NOTE','STATUS_CHANGE')),
  action_text text NOT NULL,
  actor_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_activity_target_check CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL)
    OR (lead_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_lead_id ON public.crm_activity_timeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_customer_id ON public.crm_activity_timeline(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_activity_at ON public.crm_activity_timeline(activity_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NULL REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  customer_id uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount numeric(18,2) NOT NULL DEFAULT 0,
  discount_percent numeric(8,2) NOT NULL DEFAULT 0,
  tax_percent numeric(8,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','APPROVED','REJECTED')),
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_quotation_target_check CHECK (
    lead_id IS NOT NULL OR customer_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_crm_quotations_lead_id ON public.crm_quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotations_customer_id ON public.crm_quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotations_status ON public.crm_quotations(status);

CREATE TABLE IF NOT EXISTS public.crm_quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  cable_type text NOT NULL,
  core_count integer NOT NULL DEFAULT 1,
  length numeric(18,4) NOT NULL DEFAULT 0,
  insulation_type text,
  voltage_grade text,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_price numeric(18,4) NOT NULL DEFAULT 0,
  total_price numeric(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crm_quotation_items_quotation_id ON public.crm_quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotation_items_product_id ON public.crm_quotation_items(product_id);

-- ---------------------------------------------------------------------------
-- Reuse sales_orders for CRM conversion + finance
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.sales_orders
  ADD COLUMN IF NOT EXISTS quotation_id uuid NULL REFERENCES public.crm_quotations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid NULL REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS delivery_date date NULL;

CREATE INDEX IF NOT EXISTS idx_sales_orders_quotation_id ON public.sales_orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_lead_id ON public.sales_orders(lead_id);

-- ---------------------------------------------------------------------------
-- PPC entities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ppc_bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_per_unit numeric(18,6) NOT NULL CHECK (quantity_per_unit > 0),
  unit_cost numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, material_product_id)
);

CREATE TABLE IF NOT EXISTS public.ppc_production_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','BLOCKED')),
  inventory_shortage boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sales_order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_ppc_production_plans_sales_order_id ON public.ppc_production_plans(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_ppc_production_plans_status ON public.ppc_production_plans(status);

CREATE TABLE IF NOT EXISTS public.ppc_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id uuid NOT NULL REFERENCES public.ppc_production_plans(id) ON DELETE CASCADE,
  machine_id text,
  operator_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
  output numeric(18,4) NOT NULL DEFAULT 0,
  defects numeric(18,4) NOT NULL DEFAULT 0,
  started_at timestamptz NULL,
  ended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppc_work_orders_plan_id ON public.ppc_work_orders(production_plan_id);
CREATE INDEX IF NOT EXISTS idx_ppc_work_orders_operator_id ON public.ppc_work_orders(operator_id);

CREATE TABLE IF NOT EXISTS public.ppc_qc_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.ppc_work_orders(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  result text NOT NULL CHECK (result IN ('PASS','FAIL')),
  remarks text,
  inspector_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppc_qc_reports_work_order_id ON public.ppc_qc_reports(work_order_id);

ALTER TABLE IF EXISTS public.dispatches
  ADD COLUMN IF NOT EXISTS production_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qc_passed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transport_details text;

-- finance integration (if no invoice table exists)
CREATE TABLE IF NOT EXISTS public.finance_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ISSUED','PAID','PARTIAL','OVERDUE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sales_order_id)
);

-- material consumption audit for inventory deduction traceability
CREATE TABLE IF NOT EXISTS public.ppc_material_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id uuid NOT NULL REFERENCES public.ppc_production_plans(id) ON DELETE CASCADE,
  material_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  required_qty numeric(18,4) NOT NULL DEFAULT 0,
  consumed_qty numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_sync_lead_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.score :=
    COALESCE(NEW.budget_score, 0)
    + COALESCE(NEW.requirement_clarity_score, 0)
    + COALESCE(NEW.urgency_score, 0)
    + COALESCE(NEW.engagement_score, 0)
    + COALESCE(NEW.decision_authority_score, 0);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_sync_lead_score ON public.crm_leads;
CREATE TRIGGER trg_crm_sync_lead_score
BEFORE INSERT OR UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.crm_sync_lead_score();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_quotations_updated_at ON public.crm_quotations;
CREATE TRIGGER trg_crm_quotations_updated_at BEFORE UPDATE ON public.crm_quotations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_ppc_production_plans_updated_at ON public.ppc_production_plans;
CREATE TRIGGER trg_ppc_production_plans_updated_at BEFORE UPDATE ON public.ppc_production_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_ppc_work_orders_updated_at ON public.ppc_work_orders;
CREATE TRIGGER trg_ppc_work_orders_updated_at BEFORE UPDATE ON public.ppc_work_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Workflow RPC functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_convert_lead_to_customer(p_lead_id uuid, p_assigned_user uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.crm_leads%ROWTYPE;
  v_customer_id uuid;
BEGIN
  SELECT * INTO v_lead FROM public.crm_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE lower(COALESCE(c.email, '')) = lower(COALESCE(v_lead.email, ''))
    OR lower(COALESCE(c.company_name, c.name, '')) = lower(COALESCE(v_lead.company_name, ''))
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      name, company_name, contact_person, email, phone, credit_limit
    ) VALUES (
      v_lead.company_name, v_lead.company_name, v_lead.contact_person, v_lead.email, v_lead.phone, 0
    )
    RETURNING id INTO v_customer_id;
  END IF;

  UPDATE public.crm_leads
  SET customer_id = v_customer_id, status = 'WON', won_at = now(), assigned_to = COALESCE(p_assigned_user, assigned_to)
  WHERE id = p_lead_id;

  INSERT INTO public.crm_activity_timeline(lead_id, activity_type, action_text, actor_user_id)
  VALUES (p_lead_id, 'STATUS_CHANGE', 'Lead converted to customer', p_assigned_user);

  RETURN v_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_convert_quotation_to_sales_order(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_order_number text,
  p_order_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.crm_quotations%ROWTYPE;
  v_so_id uuid;
  v_item record;
BEGIN
  SELECT * INTO v_quote FROM public.crm_quotations WHERE id = p_quotation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  IF v_quote.customer_id IS NULL THEN
    RAISE EXCEPTION 'Quotation must be linked to a customer';
  END IF;

  INSERT INTO public.sales_orders (
    branch_id, customer_id, quotation_id, lead_id, order_number, order_date, total_amount, status, order_status, delivery_date
  ) VALUES (
    p_branch_id, v_quote.customer_id, v_quote.id, v_quote.lead_id, p_order_number, p_order_date, v_quote.total_amount, 'CONFIRMED', 'CONFIRMED', NULL
  )
  RETURNING id INTO v_so_id;

  FOR v_item IN
    SELECT * FROM public.crm_quotation_items WHERE quotation_id = p_quotation_id
  LOOP
    INSERT INTO public.sales_order_items(sales_order_id, product_id, quantity, unit_price, amount)
    VALUES (v_so_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.total_price);
  END LOOP;

  UPDATE public.crm_quotations SET status = 'APPROVED' WHERE id = p_quotation_id;

  INSERT INTO public.finance_invoices(sales_order_id, customer_id, invoice_number, amount, status)
  VALUES (
    v_so_id,
    v_quote.customer_id,
    'INV-' || upper(replace(v_so_id::text, '-', ''))::text,
    v_quote.total_amount,
    'ISSUED'
  )
  ON CONFLICT (sales_order_id) DO NOTHING;

  RETURN v_so_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppc_create_plan_from_sales_order(
  p_sales_order_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_start_date date,
  p_end_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  INSERT INTO public.ppc_production_plans(sales_order_id, product_id, quantity, start_date, end_date, status, created_by)
  VALUES (p_sales_order_id, p_product_id, p_quantity, p_start_date, p_end_date, 'PLANNED', auth.uid())
  RETURNING id INTO v_plan_id;

  INSERT INTO public.ppc_material_consumption(production_plan_id, material_product_id, required_qty, consumed_qty)
  SELECT
    v_plan_id,
    b.material_product_id,
    b.quantity_per_unit * p_quantity,
    0
  FROM public.ppc_bom_items b
  WHERE b.product_id = p_product_id;

  RETURN v_plan_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppc_mrp_shortage_for_plan(p_plan_id uuid)
RETURNS TABLE (
  material_product_id uuid,
  required_qty numeric,
  available_qty numeric,
  shortage_qty numeric,
  suggested_purchase_qty numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH req AS (
    SELECT c.material_product_id, SUM(c.required_qty) AS required_qty
    FROM public.ppc_material_consumption c
    WHERE c.production_plan_id = p_plan_id
    GROUP BY c.material_product_id
  ),
  inv AS (
    SELECT i.product_id, SUM(i.quantity) AS available_qty
    FROM public.inventory i
    GROUP BY i.product_id
  )
  SELECT
    r.material_product_id,
    r.required_qty,
    COALESCE(inv.available_qty, 0) AS available_qty,
    GREATEST(r.required_qty - COALESCE(inv.available_qty, 0), 0) AS shortage_qty,
    CASE
      WHEN r.required_qty - COALESCE(inv.available_qty, 0) > 0
      THEN CEIL((r.required_qty - COALESCE(inv.available_qty, 0)) * 1.10)
      ELSE 0
    END AS suggested_purchase_qty
  FROM req r
  LEFT JOIN inv ON inv.product_id = r.material_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppc_record_qc_result(
  p_work_order_id uuid,
  p_test_type text,
  p_result text,
  p_remarks text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qc_id uuid;
  v_plan_id uuid;
BEGIN
  INSERT INTO public.ppc_qc_reports(work_order_id, test_type, result, remarks, inspector_id)
  VALUES (p_work_order_id, p_test_type, p_result, p_remarks, auth.uid())
  RETURNING id INTO v_qc_id;

  UPDATE public.ppc_work_orders
  SET status = CASE WHEN upper(p_result) = 'FAIL' THEN 'FAILED' ELSE status END
  WHERE id = p_work_order_id;

  SELECT production_plan_id INTO v_plan_id FROM public.ppc_work_orders WHERE id = p_work_order_id;
  IF upper(p_result) = 'FAIL' THEN
    UPDATE public.ppc_production_plans SET status = 'BLOCKED' WHERE id = v_plan_id;
  END IF;

  RETURN v_qc_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppc_mark_work_order_completed(
  p_work_order_id uuid,
  p_output numeric,
  p_defects numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_pending_count integer;
BEGIN
  UPDATE public.ppc_work_orders
  SET status = 'COMPLETED', output = p_output, defects = p_defects, ended_at = now()
  WHERE id = p_work_order_id
  RETURNING production_plan_id INTO v_plan_id;

  SELECT COUNT(*) INTO v_pending_count
  FROM public.ppc_work_orders
  WHERE production_plan_id = v_plan_id
    AND status IN ('PENDING','RUNNING','FAILED');

  IF v_pending_count = 0 THEN
    UPDATE public.ppc_production_plans SET status = 'COMPLETED' WHERE id = v_plan_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppc_allow_dispatch(
  p_sales_order_id uuid,
  p_branch_id uuid,
  p_dispatch_date date,
  p_transport_details text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_count integer;
  v_open_plan_count integer;
  v_failed_qc_count integer;
  v_dispatch_id uuid;
BEGIN
  SELECT COUNT(*) INTO v_plan_count
  FROM public.ppc_production_plans
  WHERE sales_order_id = p_sales_order_id;

  IF v_plan_count = 0 THEN
    RAISE EXCEPTION 'Dispatch blocked: production plan does not exist';
  END IF;

  SELECT COUNT(*) INTO v_open_plan_count
  FROM public.ppc_production_plans
  WHERE sales_order_id = p_sales_order_id
    AND status <> 'COMPLETED';

  IF v_open_plan_count > 0 THEN
    RAISE EXCEPTION 'Dispatch blocked: production is not complete';
  END IF;

  SELECT COUNT(*) INTO v_failed_qc_count
  FROM public.ppc_qc_reports qr
  JOIN public.ppc_work_orders wo ON wo.id = qr.work_order_id
  JOIN public.ppc_production_plans pp ON pp.id = wo.production_plan_id
  WHERE pp.sales_order_id = p_sales_order_id
    AND qr.result = 'FAIL';

  IF v_failed_qc_count > 0 THEN
    RAISE EXCEPTION 'Dispatch blocked: QC has failed records';
  END IF;

  INSERT INTO public.dispatches(branch_id, sales_order_id, dispatch_date, status, production_completed, qc_passed, transport_details, created_by)
  VALUES (p_branch_id, p_sales_order_id, p_dispatch_date, 'READY', true, true, p_transport_details, auth.uid())
  RETURNING id INTO v_dispatch_id;

  RETURN v_dispatch_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_qc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppc_material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_leads_sales_read ON public.crm_leads;
CREATE POLICY crm_leads_sales_read ON public.crm_leads
FOR SELECT TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES')
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS crm_leads_sales_write ON public.crm_leads;
CREATE POLICY crm_leads_sales_write ON public.crm_leads
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES')
);

DROP POLICY IF EXISTS crm_quotes_sales_access ON public.crm_quotations;
CREATE POLICY crm_quotes_sales_access ON public.crm_quotations
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES', 'FINANCE')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES', 'FINANCE')
);

DROP POLICY IF EXISTS crm_quote_items_sales_access ON public.crm_quotation_items;
CREATE POLICY crm_quote_items_sales_access ON public.crm_quotation_items
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('SALES_EXECUTIVE', 'CUSTOMER_RELATIONS_MANAGER', 'SALES')
);

DROP POLICY IF EXISTS ppc_production_access ON public.ppc_production_plans;
CREATE POLICY ppc_production_access ON public.ppc_production_plans
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION', 'PRODUCTION_MANAGER', 'STORE_MANAGER')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION', 'PRODUCTION_MANAGER', 'STORE_MANAGER')
);

DROP POLICY IF EXISTS ppc_work_orders_access ON public.ppc_work_orders;
CREATE POLICY ppc_work_orders_access ON public.ppc_work_orders
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION', 'PRODUCTION_MANAGER')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION', 'PRODUCTION_MANAGER')
);

DROP POLICY IF EXISTS ppc_qc_access ON public.ppc_qc_reports;
CREATE POLICY ppc_qc_access ON public.ppc_qc_reports
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('QC_MANAGER', 'PRODUCTION_MANAGER', 'PRODUCTION')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('QC_MANAGER', 'PRODUCTION_MANAGER', 'PRODUCTION')
);

DROP POLICY IF EXISTS ppc_bom_access ON public.ppc_bom_items;
CREATE POLICY ppc_bom_access ON public.ppc_bom_items
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION_MANAGER', 'STORE_MANAGER', 'PRODUCTION')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION_MANAGER', 'STORE_MANAGER', 'PRODUCTION')
);

DROP POLICY IF EXISTS ppc_material_consumption_access ON public.ppc_material_consumption;
CREATE POLICY ppc_material_consumption_access ON public.ppc_material_consumption
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION_MANAGER', 'STORE_MANAGER', 'PRODUCTION')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('PRODUCTION_MANAGER', 'STORE_MANAGER', 'PRODUCTION')
);

DROP POLICY IF EXISTS finance_invoice_access ON public.finance_invoices;
CREATE POLICY finance_invoice_access ON public.finance_invoices
FOR ALL TO authenticated
USING (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('FINANCE', 'ACCOUNTS_EXECUTIVE')
)
WITH CHECK (
  public.current_user_is_admin()
  OR public.current_user_role_code() IN ('FINANCE', 'ACCOUNTS_EXECUTIVE')
);

-- ---------------------------------------------------------------------------
-- Realtime subscriptions
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.crm_leads,
      public.crm_activity_timeline,
      public.crm_quotations,
      public.crm_quotation_items,
      public.ppc_production_plans,
      public.ppc_work_orders,
      public.ppc_qc_reports,
      public.ppc_material_consumption,
      public.finance_invoices;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ---------------------------------------------------------------------------
-- Legacy migration helpers (avoid duplicate customers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.migrate_legacy_clients_to_customers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  IF to_regclass('public.clients') IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.customers(name, company_name, email, phone, contact_person, gstin)
  SELECT
    COALESCE(c.record->>'CompanyName', c.record->>'ClientName', 'Unknown'),
    COALESCE(c.record->>'CompanyName', c.record->>'ClientName', 'Unknown'),
    NULLIF(c.record->>'Email', ''),
    NULLIF(c.record->>'Phone', ''),
    NULLIF(c.record->>'ContactPerson', ''),
    NULLIF(c.record->>'GSTNumber', '')
  FROM public.clients c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.customers x
    WHERE lower(COALESCE(x.email, '')) = lower(COALESCE(c.record->>'Email', ''))
      OR lower(COALESCE(x.company_name, x.name, '')) = lower(COALESCE(c.record->>'CompanyName', c.record->>'ClientName', ''))
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

COMMIT;

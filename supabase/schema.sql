-- =============================================================================
-- REYANSH ERP – SUPABASE POSTGRESQL SCHEMA
-- Production-grade, SaaS-ready. Execute in Supabase SQL Editor.
-- After creating your own Supabase project, set REACT_APP_SUPABASE_URL to https://<your-project-ref>.supabase.co
-- =============================================================================
-- Uses: UUID PKs, created_at/updated_at, soft delete (deleted_at), RLS, audit-ready.
-- Auth: users table references auth.users(id). Role-based access via roles table.
-- =============================================================================

-- Enable required extensions (Supabase usually has these)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TRIGGER: Auto-update updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Sets updated_at to now() for trigger use.';

-- =============================================================================
-- 2. ROLES (flexible, no enums)
-- =============================================================================
CREATE TABLE public.roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_code ON public.roles(code);

COMMENT ON TABLE public.roles IS 'Flexible roles: CEO, Vendor, Customer, Store Manager, etc. Extendable without schema change.';

-- Seed essential role codes (optional – can be done via app)
INSERT INTO public.roles (name, code) VALUES
  ('CEO', 'CEO'),
  ('Vendor', 'VENDOR'),
  ('Customer', 'CUSTOMER'),
  ('Store Manager', 'STORE_MANAGER'),
  ('Customer Relations Manager', 'CUSTOMER_RELATIONS_MANAGER'),
  ('Process Coordinator', 'PROCESS_COORDINATOR'),
  ('Sales Executive', 'SALES_EXECUTIVE'),
  ('QC Manager', 'QC_MANAGER'),
  ('Purchase Executive', 'PURCHASE_EXECUTIVE')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. BRANCHES (multi-factory)
-- =============================================================================
CREATE TABLE public.branches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  address    TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_code ON public.branches(code);
CREATE INDEX idx_branches_deleted_at ON public.branches(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. VENDORS
-- =============================================================================
CREATE TABLE public.vendors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  code       TEXT,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  gstin      TEXT,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_branch_id ON public.vendors(branch_id);
CREATE INDEX idx_vendors_deleted_at ON public.vendors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_email ON public.vendors(email) WHERE email IS NOT NULL;

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. CUSTOMERS
-- =============================================================================
CREATE TABLE public.customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  code       TEXT,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  gstin      TEXT,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_branch_id ON public.customers(branch_id);
CREATE INDEX idx_customers_deleted_at ON public.customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. USERS (links to Supabase auth.users)
-- =============================================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  vendor_id   UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  branch_id   UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  deleted_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_vendor_customer_check CHECK (
    (vendor_id IS NOT NULL AND customer_id IS NULL) OR
    (vendor_id IS NULL AND customer_id IS NOT NULL) OR
    (vendor_id IS NULL AND customer_id IS NULL)
  )
);

CREATE INDEX idx_users_role_id ON public.users(role_id);
CREATE INDEX idx_users_vendor_id ON public.users(vendor_id);
CREATE INDEX idx_users_customer_id ON public.users(customer_id);
CREATE INDEX idx_users_branch_id ON public.users(branch_id);
CREATE INDEX idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.users IS 'Links auth.users to app. Internal: vendor_id and customer_id NULL. Vendor/Customer logins set respective FK.';

-- =============================================================================
-- 7. UNITS OF MEASURE
-- =============================================================================
CREATE TABLE public.units_of_measure (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uom_deleted_at ON public.units_of_measure(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER units_of_measure_updated_at
  BEFORE UPDATE ON public.units_of_measure
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.units_of_measure (name, code) VALUES
  ('Piece', 'PCS'),
  ('Kilogram', 'KG'),
  ('Meter', 'M'),
  ('Liter', 'L'),
  ('Box', 'BOX')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 8. PRODUCT CATEGORIES (hierarchical)
-- =============================================================================
CREATE TABLE public.product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NULL REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_categories_parent_id ON public.product_categories(parent_id);
CREATE INDEX idx_product_categories_deleted_at ON public.product_categories(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 9. PRODUCTS
-- =============================================================================
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NULL REFERENCES public.product_categories(id) ON DELETE SET NULL,
  uom_id      UUID NOT NULL REFERENCES public.units_of_measure(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  sku         TEXT,
  hsn_code    TEXT,
  deleted_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_uom_id ON public.products(uom_id);
CREATE INDEX idx_products_deleted_at ON public.products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_code ON public.products(code) WHERE code IS NOT NULL;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 10. INVENTORY (stock per product per branch)
-- =============================================================================
CREATE TABLE public.inventory (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, product_id)
);

CREATE INDEX idx_inventory_branch_id ON public.inventory(branch_id);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_inventory_deleted_at ON public.inventory(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 11. INVENTORY BATCHES (optional batch/lot tracking)
-- =============================================================================
CREATE TABLE public.inventory_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  batch_no     TEXT NOT NULL,
  quantity     NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  expiry_date  DATE NULL,
  manufactured_date DATE NULL,
  deleted_at   TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_batches_inventory_id ON public.inventory_batches(inventory_id);
CREATE INDEX idx_inventory_batches_batch_no ON public.inventory_batches(batch_no);
CREATE INDEX idx_inventory_batches_deleted_at ON public.inventory_batches(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER inventory_batches_updated_at
  BEFORE UPDATE ON public.inventory_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 12. INVENTORY MOVEMENTS (audit trail for every stock change)
-- =============================================================================
CREATE TABLE public.inventory_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id      UUID NULL REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST', 'TRANSFER')),
  quantity      NUMERIC(18,4) NOT NULL,
  reference_type TEXT NULL,
  reference_id  UUID NULL,
  performed_by  UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  remarks       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_branch_id ON public.inventory_movements(branch_id);
CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_batch_id ON public.inventory_movements(batch_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements(reference_type, reference_id);

-- =============================================================================
-- 13. PURCHASE ORDERS
-- =============================================================================
CREATE TABLE public.purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  order_number  TEXT NOT NULL,
  order_date    DATE NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'INR',
  total_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'DRAFT',
  created_by    UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_branch_id ON public.purchase_orders(branch_id);
CREATE INDEX idx_purchase_orders_vendor_id ON public.purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_deleted_at ON public.purchase_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_order_date ON public.purchase_orders(order_date);
CREATE UNIQUE INDEX idx_purchase_orders_order_number ON public.purchase_orders(branch_id, order_number) WHERE deleted_at IS NULL;

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 14. PURCHASE ORDER ITEMS
-- =============================================================================
CREATE TABLE public.purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity          NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
  unit_price        NUMERIC(18,4) NOT NULL,
  amount            NUMERIC(18,2) NOT NULL,
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);
CREATE INDEX idx_purchase_order_items_deleted_at ON public.purchase_order_items(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 15. PURCHASE ORDER STEPS (explicit step tracking)
-- =============================================================================
CREATE TABLE public.purchase_order_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  step_name         TEXT NOT NULL,
  step_order        INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  assigned_to       UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at      TIMESTAMPTZ NULL,
  remarks           TEXT,
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_order_steps_po_id ON public.purchase_order_steps(purchase_order_id);
CREATE INDEX idx_purchase_order_steps_assigned_to ON public.purchase_order_steps(assigned_to);
CREATE INDEX idx_purchase_order_steps_deleted_at ON public.purchase_order_steps(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER purchase_order_steps_updated_at
  BEFORE UPDATE ON public.purchase_order_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 16. SALES ORDERS
-- =============================================================================
CREATE TABLE public.sales_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_number  TEXT NOT NULL,
  order_date    DATE NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'INR',
  total_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'DRAFT',
  created_by    UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_orders_branch_id ON public.sales_orders(branch_id);
CREATE INDEX idx_sales_orders_customer_id ON public.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_created_by ON public.sales_orders(created_by);
CREATE INDEX idx_sales_orders_deleted_at ON public.sales_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_orders_order_date ON public.sales_orders(order_date);
CREATE UNIQUE INDEX idx_sales_orders_order_number ON public.sales_orders(branch_id, order_number) WHERE deleted_at IS NULL;

CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 17. SALES ORDER ITEMS
-- =============================================================================
CREATE TABLE public.sales_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id  UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(18,4) NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  deleted_at      TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_order_items_so_id ON public.sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_product_id ON public.sales_order_items(product_id);
CREATE INDEX idx_sales_order_items_deleted_at ON public.sales_order_items(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER sales_order_items_updated_at
  BEFORE UPDATE ON public.sales_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 18. SALES ORDER STEPS (explicit step tracking)
-- =============================================================================
CREATE TABLE public.sales_order_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id  UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  step_name       TEXT NOT NULL,
  step_order      INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  assigned_to     UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ NULL,
  remarks         TEXT,
  deleted_at      TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_order_steps_so_id ON public.sales_order_steps(sales_order_id);
CREATE INDEX idx_sales_order_steps_assigned_to ON public.sales_order_steps(assigned_to);
CREATE INDEX idx_sales_order_steps_deleted_at ON public.sales_order_steps(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER sales_order_steps_updated_at
  BEFORE UPDATE ON public.sales_order_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 19. PAYMENTS (partial payments; order_type + nullable PO/SO FKs)
-- =============================================================================
CREATE TABLE public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type        TEXT NOT NULL CHECK (order_type IN ('purchase', 'sales')),
  purchase_order_id UUID NULL REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  sales_order_id    UUID NULL REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  branch_id         UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  amount            NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL DEFAULT 'INR',
  payment_date      DATE NOT NULL,
  reference_number  TEXT,
  remarks           TEXT,
  created_by        UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_order_fk_check CHECK (
    (order_type = 'purchase' AND purchase_order_id IS NOT NULL AND sales_order_id IS NULL) OR
    (order_type = 'sales' AND sales_order_id IS NOT NULL AND purchase_order_id IS NULL)
  )
);

CREATE INDEX idx_payments_purchase_order_id ON public.payments(purchase_order_id);
CREATE INDEX idx_payments_sales_order_id ON public.payments(sales_order_id);
CREATE INDEX idx_payments_branch_id ON public.payments(branch_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_deleted_at ON public.payments(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 20. DISPATCHES
-- =============================================================================
CREATE TABLE public.dispatches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  sales_order_id  UUID NULL REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  dispatch_date   DATE NOT NULL,
  reference       TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  created_by      UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at      TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatches_branch_id ON public.dispatches(branch_id);
CREATE INDEX idx_dispatches_sales_order_id ON public.dispatches(sales_order_id);
CREATE INDEX idx_dispatches_deleted_at ON public.dispatches(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER dispatches_updated_at
  BEFORE UPDATE ON public.dispatches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 21. DOCUMENTS (Supabase Storage reference; nullable FKs to PO, SO, vendor, customer)
-- =============================================================================
CREATE TABLE public.documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path      TEXT NOT NULL,
  file_name         TEXT,
  mime_type         TEXT,
  purchase_order_id UUID NULL REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  sales_order_id    UUID NULL REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  vendor_id         UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  customer_id       UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  uploaded_by       UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_po_id ON public.documents(purchase_order_id);
CREATE INDEX idx_documents_so_id ON public.documents(sales_order_id);
CREATE INDEX idx_documents_vendor_id ON public.documents(vendor_id);
CREATE INDEX idx_documents_customer_id ON public.documents(customer_id);
CREATE INDEX idx_documents_deleted_at ON public.documents(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 22. CRM LOGS
-- =============================================================================
CREATE TABLE public.crm_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id     UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  log_type    TEXT NOT NULL,
  subject     TEXT,
  body        TEXT,
  metadata    JSONB NULL,
  deleted_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_logs_customer_id ON public.crm_logs(customer_id);
CREATE INDEX idx_crm_logs_user_id ON public.crm_logs(user_id);
CREATE INDEX idx_crm_logs_created_at ON public.crm_logs(created_at);
CREATE INDEX idx_crm_logs_deleted_at ON public.crm_logs(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER crm_logs_updated_at
  BEFORE UPDATE ON public.crm_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 23. AUDIT LOGS (for future triggers / app-level logging)
-- =============================================================================
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  table_name  TEXT NOT NULL,
  row_id      UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    JSONB NULL,
  new_data    JSONB NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_row ON public.audit_logs(table_name, row_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

COMMENT ON TABLE public.audit_logs IS 'App/trigger populates this. RLS should allow insert for service role and read for authorized users.';

-- =============================================================================
-- 24. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.roles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measure         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs               ENABLE ROW LEVEL SECURITY;

-- Helper: get current app user row (requires auth.uid() to exist)
CREATE OR REPLACE FUNCTION public.get_app_user()
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- Helper: is current user CEO (by role code)
CREATE OR REPLACE FUNCTION public.current_user_is_ceo()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.id = u.role_id AND r.code = 'CEO'
    WHERE u.id = auth.uid() AND u.deleted_at IS NULL
  );
$$;

-- Helper: current user's vendor_id (NULL if not a vendor)
CREATE OR REPLACE FUNCTION public.current_user_vendor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id FROM public.users WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- Helper: current user's customer_id (NULL if not a customer)
CREATE OR REPLACE FUNCTION public.current_user_customer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id FROM public.users WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- ----- ROLES: readable by authenticated users -----
CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT TO authenticated USING (true);

-- ----- BRANCHES -----
CREATE POLICY "branches_select_authenticated" ON public.branches
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- ----- VENDORS -----
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "vendors_all_ceo" ON public.vendors
  FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- CUSTOMERS -----
CREATE POLICY "customers_select_authenticated" ON public.customers
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "customers_all_ceo" ON public.customers
  FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- USERS: users can read own row; CEO can read all -----
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.current_user_is_ceo());

-- ----- UOM / CATEGORIES: read for authenticated; write for CEO -----
CREATE POLICY "uom_select" ON public.units_of_measure FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "uom_all_ceo" ON public.units_of_measure FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

CREATE POLICY "product_categories_select" ON public.product_categories FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "product_categories_all_ceo" ON public.product_categories FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- PRODUCTS -----
CREATE POLICY "products_select_authenticated" ON public.products FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "products_all_ceo" ON public.products FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- INVENTORY -----
CREATE POLICY "inventory_select_authenticated" ON public.inventory FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "inventory_all_ceo" ON public.inventory FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

CREATE POLICY "inventory_batches_select" ON public.inventory_batches FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "inventory_batches_all_ceo" ON public.inventory_batches FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_movements_insert_ceo" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.current_user_is_ceo());

-- ----- PURCHASE ORDERS: CEO full access; Vendors only their own -----
CREATE POLICY "purchase_orders_ceo_full" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (public.current_user_is_ceo())
  WITH CHECK (public.current_user_is_ceo());

CREATE POLICY "purchase_orders_vendor_own" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (
    NOT public.current_user_is_ceo()
    AND vendor_id = public.current_user_vendor_id()
    AND deleted_at IS NULL
  );

CREATE POLICY "purchase_orders_internal_all" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (
    (public.current_user_vendor_id() IS NULL AND public.current_user_customer_id() IS NULL)
    AND deleted_at IS NULL
  )
  WITH CHECK (
    (public.current_user_vendor_id() IS NULL AND public.current_user_customer_id() IS NULL)
  );

-- ----- PURCHASE ORDER ITEMS / STEPS (follow PO visibility) -----
CREATE POLICY "purchase_order_items_ceo" ON public.purchase_order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND (public.current_user_is_ceo() OR po.vendor_id = public.current_user_vendor_id()) AND po.deleted_at IS NULL)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND (public.current_user_is_ceo() OR po.vendor_id = public.current_user_vendor_id()) AND po.deleted_at IS NULL)
);

CREATE POLICY "purchase_order_steps_ceo" ON public.purchase_order_steps FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_steps.purchase_order_id AND (public.current_user_is_ceo() OR po.vendor_id = public.current_user_vendor_id()) AND po.deleted_at IS NULL)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_steps.purchase_order_id AND (public.current_user_is_ceo() OR po.vendor_id = public.current_user_vendor_id()) AND po.deleted_at IS NULL)
);

-- ----- SALES ORDERS: CEO full access; Customers only their own -----
CREATE POLICY "sales_orders_ceo_full" ON public.sales_orders
  FOR ALL TO authenticated
  USING (public.current_user_is_ceo())
  WITH CHECK (public.current_user_is_ceo());

CREATE POLICY "sales_orders_customer_own" ON public.sales_orders
  FOR SELECT TO authenticated
  USING (
    NOT public.current_user_is_ceo()
    AND customer_id = public.current_user_customer_id()
    AND deleted_at IS NULL
  );

CREATE POLICY "sales_orders_internal_all" ON public.sales_orders
  FOR ALL TO authenticated
  USING (
    (public.current_user_vendor_id() IS NULL AND public.current_user_customer_id() IS NULL)
    AND deleted_at IS NULL
  )
  WITH CHECK (
    (public.current_user_vendor_id() IS NULL AND public.current_user_customer_id() IS NULL)
  );

-- ----- SALES ORDER ITEMS / STEPS -----
CREATE POLICY "sales_order_items_ceo_customer" ON public.sales_order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = sales_order_items.sales_order_id AND (public.current_user_is_ceo() OR so.customer_id = public.current_user_customer_id()) AND so.deleted_at IS NULL)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = sales_order_items.sales_order_id AND (public.current_user_is_ceo() OR so.customer_id = public.current_user_customer_id()) AND so.deleted_at IS NULL)
);

CREATE POLICY "sales_order_steps_ceo_customer" ON public.sales_order_steps FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = sales_order_steps.sales_order_id AND (public.current_user_is_ceo() OR so.customer_id = public.current_user_customer_id()) AND so.deleted_at IS NULL)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = sales_order_steps.sales_order_id AND (public.current_user_is_ceo() OR so.customer_id = public.current_user_customer_id()) AND so.deleted_at IS NULL)
);

-- ----- PAYMENTS -----
CREATE POLICY "payments_ceo_full" ON public.payments FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());
CREATE POLICY "payments_vendor_own_po" ON public.payments FOR SELECT TO authenticated USING (
  order_type = 'purchase' AND purchase_order_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = payments.purchase_order_id AND po.vendor_id = public.current_user_vendor_id() AND po.deleted_at IS NULL)
  AND deleted_at IS NULL
);
CREATE POLICY "payments_customer_own_so" ON public.payments FOR SELECT TO authenticated USING (
  order_type = 'sales' AND sales_order_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = payments.sales_order_id AND so.customer_id = public.current_user_customer_id() AND so.deleted_at IS NULL)
  AND deleted_at IS NULL
);

-- ----- DISPATCHES -----
CREATE POLICY "dispatches_select_authenticated" ON public.dispatches FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "dispatches_all_ceo" ON public.dispatches FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- DOCUMENTS -----
CREATE POLICY "documents_select_authenticated" ON public.documents FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "documents_all_ceo" ON public.documents FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- CRM LOGS -----
CREATE POLICY "crm_logs_select_authenticated" ON public.crm_logs FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "crm_logs_all_ceo" ON public.crm_logs FOR ALL TO authenticated USING (public.current_user_is_ceo()) WITH CHECK (public.current_user_is_ceo());

-- ----- AUDIT LOGS: insert by app; read for CEO only -----
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_logs_select_ceo" ON public.audit_logs FOR SELECT TO authenticated USING (public.current_user_is_ceo());

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

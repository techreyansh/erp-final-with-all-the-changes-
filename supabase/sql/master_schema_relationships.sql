-- =============================================================================
-- MASTER: normalized ERP foreign keys (supabase/schema.sql model)
-- =============================================================================
-- Run in Supabase SQL Editor (or psql). Idempotent: skips FKs that already exist.
-- Sheet-style tables (clients, etc. with only jsonb "record") are NOT linked here;
-- add UUID columns first, then new ALTER TABLE ... ADD CONSTRAINT lines.
--
-- RELATIONSHIP MAP (public schema, + auth.users)
-- ---------------------------------------------
-- auth.users  <-- public.users.id (PK/FK, CASCADE delete profile when auth user deleted)
--
-- roles
--   ^-- users.role_id (RESTRICT)
--
-- branches
--   ^-- vendors.branch_id, customers.branch_id, users.branch_id (SET NULL)
--   ^-- inventory.branch_id (CASCADE), inventory_movements.branch_id (CASCADE)
--   ^-- purchase_orders.branch_id (CASCADE), sales_orders.branch_id (CASCADE)
--   ^-- payments.branch_id (SET NULL), dispatches.branch_id (CASCADE)
--
-- vendors
--   ^-- users.vendor_id (SET NULL)
--   ^-- purchase_orders.vendor_id (RESTRICT), documents.vendor_id (SET NULL)
--
-- customers
--   ^-- users.customer_id (SET NULL)
--   ^-- sales_orders.customer_id (RESTRICT)
--   ^-- documents.customer_id, crm_logs.customer_id (SET NULL)
--
-- users
--   ^-- inventory_movements.performed_by, PO/SO created_by, steps.assigned_to
--   ^-- payments, dispatches, documents.uploaded_by, crm_logs.user_id, audit_logs.user_id (SET NULL)
--
-- product_categories (self: parent_id)
-- units_of_measure
--   ^-- products.uom_id (RESTRICT)
-- products
--   ^-- products.category_id (SET NULL)
--   ^-- inventory, inventory_movements, PO items, SO items (RESTRICT/CASCADE as per block)
--
-- inventory -> inventory_batches -> inventory_movements (chain)
--
-- purchase_orders
--   ^-- purchase_order_items, purchase_order_steps (CASCADE)
--   ^-- payments (SET NULL), documents (SET NULL)
--
-- sales_orders
--   ^-- sales_order_items, sales_order_steps (CASCADE)
--   ^-- payments, dispatches, documents (SET NULL)
--
-- =============================================================================
-- Add missing FOREIGN KEY constraints (idempotent, data-safe pattern)
-- =============================================================================
-- CONTEXT
-- -------
-- 1) Normalized ERP (supabase/schema.sql):
--    - "Customer" entity = public.customers (UUID PK).
--    - Sales orders = public.sales_orders.customer_id -> customers.id
--    - There is NO public.invoices table in schema.sql today.
--    - Most FKs are already declared inline on CREATE TABLE; this migration
--      only adds constraints that are MISSING (e.g. tables created manually).
--
-- 2) Legacy sheet-style tables (e.g. public.clients with jsonb "record"):
--    - Relationships are often stored INSIDE record, not as UUID columns.
--    - PostgreSQL cannot FK to jsonb paths without generated/stored columns.
--    - This file does NOT add columns; no FKs for pure jsonb refs.
--
-- BEFORE RUNNING ON PRODUCTION
-- ----------------------------
-- Fix orphan rows (FK target missing) or ADD CONSTRAINT will fail, e.g.:
--   SELECT so.id FROM sales_orders so
--   LEFT JOIN customers c ON c.id = so.customer_id
--   WHERE c.id IS NULL AND so.customer_id IS NOT NULL;
--
-- ON DELETE policy (used below)
-- ---------------------------
-- - SET NULL: optional link, audit-friendly (payments, documents, logs, assigned_to).
-- - RESTRICT: prevent deleting parent if children exist (customers on SO, vendors on PO).
-- - CASCADE: child rows belong to parent lifecycle (line items, steps, inventory by branch).
-- =============================================================================

-- Helper: true if a foreign key already exists on (table, column) in public
CREATE OR REPLACE FUNCTION public._fk_exists(p_table text, p_column text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_schema = kcu.constraint_schema
     AND tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = p_table
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = p_column
  );
$$;

-- Helper: table exists in public
CREATE OR REPLACE FUNCTION public._tbl_exists(p_table text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  );
$$;

-- Helper: column exists on table in public
CREATE OR REPLACE FUNCTION public._col_exists(p_table text, p_column text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  );
$$;

-- -----------------------------------------------------------------------------
-- BRANCHES / VENDORS / CUSTOMERS / USERS
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF public._tbl_exists('vendors') AND public._col_exists('vendors', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('vendors', 'branch_id') THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('customers') AND public._col_exists('customers', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('customers', 'branch_id') THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- public.users(id) -> auth.users(id): fails if any public.users row has no matching auth user
-- (e.g. sheet-imported / manual rows). Only add when data is clean.
DO $$
BEGIN
  IF public._tbl_exists('users') AND public._col_exists('users', 'id')
     AND NOT public._fk_exists('users', 'id') THEN
    IF EXISTS (
      SELECT 1
      FROM public.users u
      WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id)
    ) THEN
      RAISE NOTICE 'Skipping users_id_fkey: found public.users ids not present in auth.users. Fix: DELETE those rows or sign up matching users, then re-run this migration step.';
    ELSE
      ALTER TABLE public.users
        ADD CONSTRAINT users_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('users') AND public._col_exists('users', 'role_id')
     AND public._tbl_exists('roles') AND NOT public._fk_exists('users', 'role_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('users') AND public._col_exists('users', 'vendor_id')
     AND public._tbl_exists('vendors') AND NOT public._fk_exists('users', 'vendor_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('users') AND public._col_exists('users', 'customer_id')
     AND public._tbl_exists('customers') AND NOT public._fk_exists('users', 'customer_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('users') AND public._col_exists('users', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('users', 'branch_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PRODUCTS / INVENTORY
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF public._tbl_exists('product_categories') AND public._col_exists('product_categories', 'parent_id')
     AND NOT public._fk_exists('product_categories', 'parent_id') THEN
    ALTER TABLE public.product_categories
      ADD CONSTRAINT product_categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('products') AND public._col_exists('products', 'category_id')
     AND public._tbl_exists('product_categories') AND NOT public._fk_exists('products', 'category_id') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('products') AND public._col_exists('products', 'uom_id')
     AND public._tbl_exists('units_of_measure') AND NOT public._fk_exists('products', 'uom_id') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_uom_id_fkey
      FOREIGN KEY (uom_id) REFERENCES public.units_of_measure(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory') AND public._col_exists('inventory', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('inventory', 'branch_id') THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory') AND public._col_exists('inventory', 'product_id')
     AND public._tbl_exists('products') AND NOT public._fk_exists('inventory', 'product_id') THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory_batches') AND public._col_exists('inventory_batches', 'inventory_id')
     AND public._tbl_exists('inventory') AND NOT public._fk_exists('inventory_batches', 'inventory_id') THEN
    ALTER TABLE public.inventory_batches
      ADD CONSTRAINT inventory_batches_inventory_id_fkey
      FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory_movements') AND public._col_exists('inventory_movements', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('inventory_movements', 'branch_id') THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory_movements') AND public._col_exists('inventory_movements', 'product_id')
     AND public._tbl_exists('products') AND NOT public._fk_exists('inventory_movements', 'product_id') THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory_movements') AND public._col_exists('inventory_movements', 'batch_id')
     AND public._tbl_exists('inventory_batches') AND NOT public._fk_exists('inventory_movements', 'batch_id') THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_batch_id_fkey
      FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('inventory_movements') AND public._col_exists('inventory_movements', 'performed_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('inventory_movements', 'performed_by') THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_performed_by_fkey
      FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PURCHASE ORDERS
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF public._tbl_exists('purchase_orders') AND public._col_exists('purchase_orders', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('purchase_orders', 'branch_id') THEN
    ALTER TABLE public.purchase_orders
      ADD CONSTRAINT purchase_orders_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_orders') AND public._col_exists('purchase_orders', 'vendor_id')
     AND public._tbl_exists('vendors') AND NOT public._fk_exists('purchase_orders', 'vendor_id') THEN
    ALTER TABLE public.purchase_orders
      ADD CONSTRAINT purchase_orders_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_orders') AND public._col_exists('purchase_orders', 'created_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('purchase_orders', 'created_by') THEN
    ALTER TABLE public.purchase_orders
      ADD CONSTRAINT purchase_orders_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_order_items') AND public._col_exists('purchase_order_items', 'purchase_order_id')
     AND public._tbl_exists('purchase_orders') AND NOT public._fk_exists('purchase_order_items', 'purchase_order_id') THEN
    ALTER TABLE public.purchase_order_items
      ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_order_items') AND public._col_exists('purchase_order_items', 'product_id')
     AND public._tbl_exists('products') AND NOT public._fk_exists('purchase_order_items', 'product_id') THEN
    ALTER TABLE public.purchase_order_items
      ADD CONSTRAINT purchase_order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_order_steps') AND public._col_exists('purchase_order_steps', 'purchase_order_id')
     AND public._tbl_exists('purchase_orders') AND NOT public._fk_exists('purchase_order_steps', 'purchase_order_id') THEN
    ALTER TABLE public.purchase_order_steps
      ADD CONSTRAINT purchase_order_steps_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('purchase_order_steps') AND public._col_exists('purchase_order_steps', 'assigned_to')
     AND public._tbl_exists('users') AND NOT public._fk_exists('purchase_order_steps', 'assigned_to') THEN
    ALTER TABLE public.purchase_order_steps
      ADD CONSTRAINT purchase_order_steps_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- SALES ORDERS (canonical "orders" in normalized schema → customers, not legacy clients)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF public._tbl_exists('sales_orders') AND public._col_exists('sales_orders', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('sales_orders', 'branch_id') THEN
    ALTER TABLE public.sales_orders
      ADD CONSTRAINT sales_orders_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_orders') AND public._col_exists('sales_orders', 'customer_id')
     AND public._tbl_exists('customers') AND NOT public._fk_exists('sales_orders', 'customer_id') THEN
    ALTER TABLE public.sales_orders
      ADD CONSTRAINT sales_orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_orders') AND public._col_exists('sales_orders', 'created_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('sales_orders', 'created_by') THEN
    ALTER TABLE public.sales_orders
      ADD CONSTRAINT sales_orders_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_order_items') AND public._col_exists('sales_order_items', 'sales_order_id')
     AND public._tbl_exists('sales_orders') AND NOT public._fk_exists('sales_order_items', 'sales_order_id') THEN
    ALTER TABLE public.sales_order_items
      ADD CONSTRAINT sales_order_items_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_order_items') AND public._col_exists('sales_order_items', 'product_id')
     AND public._tbl_exists('products') AND NOT public._fk_exists('sales_order_items', 'product_id') THEN
    ALTER TABLE public.sales_order_items
      ADD CONSTRAINT sales_order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_order_steps') AND public._col_exists('sales_order_steps', 'sales_order_id')
     AND public._tbl_exists('sales_orders') AND NOT public._fk_exists('sales_order_steps', 'sales_order_id') THEN
    ALTER TABLE public.sales_order_steps
      ADD CONSTRAINT sales_order_steps_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('sales_order_steps') AND public._col_exists('sales_order_steps', 'assigned_to')
     AND public._tbl_exists('users') AND NOT public._fk_exists('sales_order_steps', 'assigned_to') THEN
    ALTER TABLE public.sales_order_steps
      ADD CONSTRAINT sales_order_steps_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PAYMENTS / DISPATCHES / DOCUMENTS / CRM / AUDIT
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF public._tbl_exists('payments') AND public._col_exists('payments', 'purchase_order_id')
     AND public._tbl_exists('purchase_orders') AND NOT public._fk_exists('payments', 'purchase_order_id') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('payments') AND public._col_exists('payments', 'sales_order_id')
     AND public._tbl_exists('sales_orders') AND NOT public._fk_exists('payments', 'sales_order_id') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('payments') AND public._col_exists('payments', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('payments', 'branch_id') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('payments') AND public._col_exists('payments', 'created_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('payments', 'created_by') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('dispatches') AND public._col_exists('dispatches', 'branch_id')
     AND public._tbl_exists('branches') AND NOT public._fk_exists('dispatches', 'branch_id') THEN
    ALTER TABLE public.dispatches
      ADD CONSTRAINT dispatches_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('dispatches') AND public._col_exists('dispatches', 'sales_order_id')
     AND public._tbl_exists('sales_orders') AND NOT public._fk_exists('dispatches', 'sales_order_id') THEN
    ALTER TABLE public.dispatches
      ADD CONSTRAINT dispatches_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('dispatches') AND public._col_exists('dispatches', 'created_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('dispatches', 'created_by') THEN
    ALTER TABLE public.dispatches
      ADD CONSTRAINT dispatches_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('documents') AND public._col_exists('documents', 'purchase_order_id')
     AND public._tbl_exists('purchase_orders') AND NOT public._fk_exists('documents', 'purchase_order_id') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('documents') AND public._col_exists('documents', 'sales_order_id')
     AND public._tbl_exists('sales_orders') AND NOT public._fk_exists('documents', 'sales_order_id') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('documents') AND public._col_exists('documents', 'vendor_id')
     AND public._tbl_exists('vendors') AND NOT public._fk_exists('documents', 'vendor_id') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('documents') AND public._col_exists('documents', 'customer_id')
     AND public._tbl_exists('customers') AND NOT public._fk_exists('documents', 'customer_id') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('documents') AND public._col_exists('documents', 'uploaded_by')
     AND public._tbl_exists('users') AND NOT public._fk_exists('documents', 'uploaded_by') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_uploaded_by_fkey
      FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('crm_logs') AND public._col_exists('crm_logs', 'customer_id')
     AND public._tbl_exists('customers') AND NOT public._fk_exists('crm_logs', 'customer_id') THEN
    ALTER TABLE public.crm_logs
      ADD CONSTRAINT crm_logs_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('crm_logs') AND public._col_exists('crm_logs', 'user_id')
     AND public._tbl_exists('users') AND NOT public._fk_exists('crm_logs', 'user_id') THEN
    ALTER TABLE public.crm_logs
      ADD CONSTRAINT crm_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF public._tbl_exists('audit_logs') AND public._col_exists('audit_logs', 'user_id')
     AND public._tbl_exists('users') AND NOT public._fk_exists('audit_logs', 'user_id') THEN
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT audit_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop helpers (optional; keeps public schema clean). Comment out if you want to keep them for ops.
DROP FUNCTION IF EXISTS public._fk_exists(text, text);
DROP FUNCTION IF EXISTS public._tbl_exists(text);
DROP FUNCTION IF EXISTS public._col_exists(text, text);

-- =============================================================================
-- FUTURE: invoices + legacy clients
-- =============================================================================
-- If you add public.invoices with customer_id UUID (recommended: align with customers):
--   ALTER TABLE public.invoices
--     ADD CONSTRAINT invoices_customer_id_fkey
--     FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;
--
-- If you truly need invoices.client_id -> public.clients(id), add column client_id UUID NULL
-- first (separate migration), backfill, then:
--   ALTER TABLE public.invoices
--     ADD CONSTRAINT invoices_client_id_fkey
--     FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
--
-- orders.client_id -> clients.id: legacy sheet "orders" usually has no UUID column;
-- add client_id UUID to your order table, then FK to public.clients(id) ON DELETE SET NULL
-- or normalize to sales_orders.customer_id -> customers.
-- =============================================================================

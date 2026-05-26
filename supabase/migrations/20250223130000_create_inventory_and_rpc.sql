-- Branches (optional reference for inventory by branch).
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  code text,
  record jsonb NOT NULL DEFAULT '{}'
);

-- Current stock per branch and product. Updated only via RPC.
CREATE TABLE IF NOT EXISTS public.inventory_stock (
  branch_id uuid NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_branch
  ON public.inventory_stock (branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product
  ON public.inventory_stock (product_id);

-- Audit trail: all inventory movements. Inserted only via RPC.
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  branch_id uuid NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  quantity_delta numeric NOT NULL,
  transaction_type text NOT NULL,
  reference_id text,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_branch
  ON public.inventory_transactions (branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product
  ON public.inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created
  ON public.inventory_transactions (created_at);

-- RPC: update inventory by recording a transaction and adjusting stock. Do NOT update inventory_stock directly from the app.
CREATE OR REPLACE FUNCTION public.update_inventory_transaction(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity_delta numeric,
  p_transaction_type text DEFAULT 'adjustment',
  p_reference_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric;
  v_new_quantity numeric;
  v_transaction_id uuid;
BEGIN
  IF p_branch_id IS NULL OR p_product_id IS NULL THEN
    RAISE EXCEPTION 'branch_id and product_id are required';
  END IF;

  SELECT quantity INTO v_current
  FROM inventory_stock
  WHERE branch_id = p_branch_id AND product_id = p_product_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    v_current := 0;
  END IF;

  v_new_quantity := v_current + p_quantity_delta;
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: current %, delta %', v_current, p_quantity_delta;
  END IF;

  INSERT INTO inventory_transactions (branch_id, product_id, quantity_delta, transaction_type, reference_id, notes)
  VALUES (p_branch_id, p_product_id, p_quantity_delta, COALESCE(NULLIF(TRIM(p_transaction_type), ''), 'adjustment'), p_reference_id, p_notes)
  RETURNING id INTO v_transaction_id;

  INSERT INTO inventory_stock (branch_id, product_id, quantity, updated_at)
  VALUES (p_branch_id, p_product_id, v_new_quantity, now())
  ON CONFLICT (branch_id, product_id)
  DO UPDATE SET quantity = v_new_quantity, updated_at = now();

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'branch_id', p_branch_id,
    'product_id', p_product_id,
    'previous_quantity', v_current,
    'quantity_delta', p_quantity_delta,
    'new_quantity', v_new_quantity
  );
END;
$$;

-- RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anon branches"
  ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon inventory_stock"
  ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon inventory_transactions"
  ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

-- Grant execute to anon so the app can call the RPC
GRANT EXECUTE ON FUNCTION public.update_inventory_transaction(uuid, uuid, numeric, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_inventory_transaction(uuid, uuid, numeric, text, text, text) TO authenticated;

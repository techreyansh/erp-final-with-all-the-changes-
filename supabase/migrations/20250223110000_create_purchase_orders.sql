-- Purchase orders table with soft delete support (deleted_at).
-- RLS is enabled; do not bypass with service role in the app.

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_deleted_at
  ON public.purchase_orders (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_sort_created
  ON public.purchase_orders (sort_order, created_at);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon (app uses anon key)"
  ON public.purchase_orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Cable production module: sheet-shaped tables (id, sort_order, record jsonb) for db.js / PostgREST.
-- Logical names: "Cable Products", "Cable Production Plans", "Machine Schedules".

CREATE TABLE IF NOT EXISTS public.cable_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.cable_production_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.machine_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['cable_products', 'cable_production_plans', 'machine_schedules'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all anon" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Allow all anon" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

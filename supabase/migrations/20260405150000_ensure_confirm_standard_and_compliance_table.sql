-- Sales flow step 5 (Confirm Standards and Compliance) — sheet-style table.
-- Idempotent: safe if 20250223100000 already created this table.

CREATE TABLE IF NOT EXISTS public.confirm_standard_and_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  record jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE public.confirm_standard_and_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all anon" ON public.confirm_standard_and_compliance;
CREATE POLICY "Allow all anon" ON public.confirm_standard_and_compliance
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Nudge PostgREST to see the new table (Dashboard → Settings → API → Reload schema if this has no effect).
NOTIFY pgrst, 'reload schema';

-- Add tables to supabase_realtime publication for Postgres Changes (Realtime).
-- Idempotent: skips tables already in the publication. Skips tables that do not exist.
-- Production safe.

DO $$
DECLARE
  tbl text;
  table_exists boolean;
  already_in_pub boolean;
  tables_to_add text[] := ARRAY[
    'purchase_orders',
    'sales_orders',
    'inventory_transactions',
    'inventory_stock'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    -- Check table exists in public schema
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) INTO table_exists;

    IF NOT table_exists THEN
      RAISE NOTICE 'Realtime: table public.% does not exist, skipping', tbl;
      CONTINUE;
    END IF;

    -- Check not already in publication
    SELECT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) INTO already_in_pub;

    IF already_in_pub THEN
      RAISE NOTICE 'Realtime: public.% already in supabase_realtime, skipping', tbl;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    RAISE NOTICE 'Realtime: added public.% to supabase_realtime', tbl;
  END LOOP;
END $$;

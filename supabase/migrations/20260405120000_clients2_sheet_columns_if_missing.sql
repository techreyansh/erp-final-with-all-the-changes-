-- App clientService inserts flat keys (ClientName, Pincode, …) when table has no jsonb `record`.
-- Add any missing columns so PostgREST accepts inserts. Safe to re-run (IF NOT EXISTS).

DO $$
BEGIN
  IF to_regclass('public.clients2') IS NULL THEN
    RAISE NOTICE 'public.clients2 does not exist; skip column patch.';
    RETURN;
  END IF;

  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "ClientName" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "ClientCode" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "BusinessType" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Address" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "City" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "State" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "StateCode" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Pincode" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Country" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "GSTIN" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "PANNumber" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "AccountCode" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Website" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Contacts" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "PaymentTerms" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "CreditLimit" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "CreditPeriod" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "DeliveryTerms" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Products" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Notes" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Status" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "Rating" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "LastContactDate" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "TotalOrders" text;
  ALTER TABLE public.clients2 ADD COLUMN IF NOT EXISTS "TotalValue" text;
END $$;

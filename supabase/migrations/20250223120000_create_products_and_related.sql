-- Product categories (reference table, soft delete).
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  name text NOT NULL,
  slug text,
  description text
);

-- Make sure slug exists even if an older version of the table was created without it
ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_slug
  ON public.product_categories (slug)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_categories_deleted_at
  ON public.product_categories (deleted_at)
  WHERE deleted_at IS NULL;

-- Units of measure (reference table, soft delete).
CREATE TABLE IF NOT EXISTS public.units_of_measure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  code text NOT NULL,
  name text NOT NULL,
  symbol text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_of_measure_code
  ON public.units_of_measure (code)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_of_measure_deleted_at
  ON public.units_of_measure (deleted_at)
  WHERE deleted_at IS NULL;

-- Products (joins to product_categories and units_of_measure, soft delete).
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  name text NOT NULL,
  code text,
  description text,
  product_category_id uuid REFERENCES public.product_categories (id),
  unit_of_measure_id uuid REFERENCES public.units_of_measure (id),
  record jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_products_deleted_at
  ON public.products (deleted_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products (product_category_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_unit
  ON public.products (unit_of_measure_id)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code
  ON public.products (code)
  WHERE deleted_at IS NULL AND code IS NOT NULL;

-- RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anon product_categories"
  ON public.product_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon units_of_measure"
  ON public.units_of_measure FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon products"
  ON public.products FOR ALL USING (true) WITH CHECK (true);

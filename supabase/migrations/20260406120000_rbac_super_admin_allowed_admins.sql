-- =============================================================================
-- Super Admin RBAC: allowed_admins, user_roles, is_super_admin(), RLS.
-- RUN THIS FILE FROM THE FIRST LINE — do not run is_super_admin() alone first.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables (must run before any function references them)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.allowed_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_admins_email_lower
  ON public.allowed_admins (lower(trim(email)));

COMMENT ON TABLE public.allowed_admins IS
  'Email allowlist for is_super_admin(). RLS enforced.';

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles (role_id);

-- -----------------------------------------------------------------------------
-- 2. Normalize allowlist emails
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.allowed_admins_normalize_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_allowed_admins_normalize ON public.allowed_admins;
CREATE TRIGGER trg_allowed_admins_normalize
  BEFORE INSERT OR UPDATE OF email ON public.allowed_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.allowed_admins_normalize_email();

-- -----------------------------------------------------------------------------
-- 3. Seed CEO + default super-admin emails (idempotent)
-- -----------------------------------------------------------------------------

INSERT INTO public.roles (name, code)
VALUES ('CEO', 'CEO')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.allowed_admins (email)
SELECT v
FROM (VALUES
  ('tech@reyanshelectronics.com'),
  ('abhishek@reyanshelectronics.com'),
  ('gauravdhikale18@gmail.com')
) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM public.allowed_admins a WHERE lower(trim(a.email)) = lower(trim(t.v))
);

-- -----------------------------------------------------------------------------
-- 4. JWT + is_super_admin + CEO alias
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT lower(trim(COALESCE(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  )));
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.allowed_admins a
      WHERE a.email = public.current_jwt_email()
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code = 'CEO'
    )
    OR EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.code = 'CEO'
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

REVOKE ALL ON FUNCTION public.current_jwt_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_jwt_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_jwt_email() TO service_role;

CREATE OR REPLACE FUNCTION public.current_user_is_ceo()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin();
$$;

REVOKE ALL ON FUNCTION public.current_user_is_ceo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_ceo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_ceo() TO service_role;

-- -----------------------------------------------------------------------------
-- 5. auth.users → user_roles + public.users (allowlist only)
--    Omit updated_at here — not all deployments have it on public.users.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_sync_super_admin_from_allowlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_ceo_id uuid;
BEGIN
  v_email := lower(trim(COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email', '')));
  IF v_email = '' OR NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.allowed_admins a WHERE a.email = v_email) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_ceo_id FROM public.roles WHERE code = 'CEO' LIMIT 1;
  IF v_ceo_id IS NULL THEN
    RAISE WARNING 'auth_sync_super_admin: CEO role missing';
    RETURN NEW;
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, v_ceo_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  INSERT INTO public.users (id, role_id, email, full_name, is_active)
  VALUES (
    NEW.id,
    v_ceo_id,
    v_email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(v_email, '@', 1)
    ),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role_id   = v_ceo_id,
    email     = EXCLUDED.email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_super_admin_allowlist ON auth.users;
CREATE TRIGGER on_auth_user_super_admin_allowlist
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auth_sync_super_admin_from_allowlist();

-- -----------------------------------------------------------------------------
-- 6. RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.allowed_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allowed_admins_super_admin_all" ON public.allowed_admins;
CREATE POLICY "allowed_admins_super_admin_all"
  ON public.allowed_admins
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "user_roles_super_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_super_admin_all"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 7. Super Admin policy on every public table that already has RLS
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND c.relname NOT LIKE 'pg\_%' ESCAPE '\'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Super Admin Full Access" ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY "Super Admin Full Access" ON public.%I FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin())',
      r.tbl
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

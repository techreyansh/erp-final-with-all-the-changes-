-- =============================================================================
-- ERP Task Checklist & Compliance System
-- Normalized task templates, recurring instance generation, proof/approval flow,
-- scoring, audit logging, and realtime-ready tables.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(trim(COALESCE(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  )));
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin_fallback()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.current_user_is_admin(),
    public.is_super_admin(),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- Task templates (master tasks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  description text,
  department text NOT NULL CHECK (department IN ('CRM', 'PPC', 'Production', 'Quality', 'Dispatch')),
  task_type text NOT NULL CHECK (task_type IN ('daily', 'weekly', 'monthly')),
  assigned_role_code text NULL,
  assigned_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_email text NULL,
  required_proof boolean NOT NULL DEFAULT false,
  scoring_weight numeric(8,2) NOT NULL DEFAULT 1 CHECK (scoring_weight >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_templates_assignment_check CHECK (
    assigned_role_code IS NOT NULL OR assigned_user_id IS NOT NULL OR assigned_email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_task_templates_department ON public.task_templates(department);
CREATE INDEX IF NOT EXISTS idx_task_templates_task_type ON public.task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_role ON public.task_templates(assigned_role_code);
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON public.task_templates(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_email ON public.task_templates((lower(trim(assigned_email))));

-- -----------------------------------------------------------------------------
-- Task instances (generated from templates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  assigned_to_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_email text NULL,
  assignee_key text GENERATED ALWAYS AS (
    COALESCE(assigned_to_user_id::text, lower(trim(assigned_to_email)))
  ) STORED,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  date_assigned timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  is_late boolean NOT NULL DEFAULT false,
  submission_link text NULL,
  submission_notes text NULL,
  submitted_at timestamptz NULL,
  approved_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by_email text NULL,
  approved_at timestamptz NULL,
  rejection_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_instances_assignee_check CHECK (
    assigned_to_user_id IS NOT NULL OR assigned_to_email IS NOT NULL
  ),
  CONSTRAINT task_instances_period_check CHECK (period_end_date >= period_start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_task_instances_dedup
  ON public.task_instances(template_id, assignee_key, period_start_date);
CREATE INDEX IF NOT EXISTS idx_task_instances_assigned_email ON public.task_instances((lower(trim(assigned_to_email))));
CREATE INDEX IF NOT EXISTS idx_task_instances_assigned_user_id ON public.task_instances(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_due_date ON public.task_instances(due_date);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON public.task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_template_id ON public.task_instances(template_id);

-- -----------------------------------------------------------------------------
-- Task submissions (optional multi-file proof)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id uuid NOT NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  uploaded_by_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_by_email text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_instance_id ON public.task_submissions(task_instance_id);

-- -----------------------------------------------------------------------------
-- User scores (aggregated compliance points)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  score_date date NOT NULL,
  daily_score numeric(12,2) NOT NULL DEFAULT 0,
  weekly_score numeric(12,2) NOT NULL DEFAULT 0,
  monthly_score numeric(12,2) NOT NULL DEFAULT 0,
  approved_points numeric(12,2) NOT NULL DEFAULT 0,
  missed_penalty numeric(12,2) NOT NULL DEFAULT 0,
  net_score numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, score_date)
);

CREATE INDEX IF NOT EXISTS idx_user_scores_date ON public.user_scores(score_date);
CREATE INDEX IF NOT EXISTS idx_user_scores_email ON public.user_scores((lower(trim(user_email))));

-- -----------------------------------------------------------------------------
-- Audit log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id uuid NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  actor_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_audit_log_instance ON public.task_audit_log(task_instance_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_log_created_at ON public.task_audit_log(created_at DESC);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_templates_touch_updated_at ON public.task_templates;
CREATE TRIGGER trg_task_templates_touch_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_task_instances_touch_updated_at ON public.task_instances;
CREATE TRIGGER trg_task_instances_touch_updated_at
BEFORE UPDATE ON public.task_instances
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.task_audit_instance_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSTANCE_CREATED';
    v_payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'INSTANCE_UPDATED';
    v_payload := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW)
    );
  ELSE
    v_action := 'INSTANCE_DELETED';
    v_payload := to_jsonb(OLD);
  END IF;

  INSERT INTO public.task_audit_log (
    task_instance_id, action, actor_user_id, actor_email, payload
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    public.current_user_email(),
    v_payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_task_instances_audit ON public.task_instances;
CREATE TRIGGER trg_task_instances_audit
AFTER INSERT OR UPDATE OR DELETE ON public.task_instances
FOR EACH ROW
EXECUTE FUNCTION public.task_audit_instance_changes();

-- -----------------------------------------------------------------------------
-- Recurrence + scoring functions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_user_score_for_date(
  p_user_email text,
  p_score_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_day_start date := p_score_date;
  v_week_start date := date_trunc('week', p_score_date)::date;
  v_month_start date := date_trunc('month', p_score_date)::date;
  v_daily numeric := 0;
  v_weekly numeric := 0;
  v_monthly numeric := 0;
  v_approved numeric := 0;
  v_penalty numeric := 0;
BEGIN
  v_email := lower(trim(COALESCE(p_user_email, '')));
  IF v_email = '' THEN
    RETURN;
  END IF;

  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE lower(trim(u.email)) = v_email
  LIMIT 1;

  SELECT COALESCE(sum(tt.scoring_weight), 0)
  INTO v_daily
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE lower(trim(COALESCE(ti.assigned_to_email, ''))) = v_email
    AND ti.status = 'approved'
    AND ti.period_start_date = v_day_start;

  SELECT COALESCE(sum(tt.scoring_weight), 0)
  INTO v_weekly
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE lower(trim(COALESCE(ti.assigned_to_email, ''))) = v_email
    AND ti.status = 'approved'
    AND ti.period_start_date >= v_week_start
    AND ti.period_start_date < (v_week_start + INTERVAL '7 days')::date;

  SELECT COALESCE(sum(tt.scoring_weight), 0)
  INTO v_monthly
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE lower(trim(COALESCE(ti.assigned_to_email, ''))) = v_email
    AND ti.status = 'approved'
    AND ti.period_start_date >= v_month_start
    AND ti.period_start_date < (v_month_start + INTERVAL '1 month')::date;

  SELECT COALESCE(sum(tt.scoring_weight), 0)
  INTO v_approved
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE lower(trim(COALESCE(ti.assigned_to_email, ''))) = v_email
    AND ti.status = 'approved'
    AND ti.period_start_date = v_day_start;

  SELECT COALESCE(sum(tt.scoring_weight * 0.5), 0)
  INTO v_penalty
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE lower(trim(COALESCE(ti.assigned_to_email, ''))) = v_email
    AND ti.period_start_date = v_day_start
    AND ti.due_date < now()
    AND ti.status IN ('pending', 'rejected');

  INSERT INTO public.user_scores (
    user_id, user_email, score_date, daily_score, weekly_score, monthly_score,
    approved_points, missed_penalty, net_score, updated_at
  ) VALUES (
    v_user_id, v_email, p_score_date, v_daily, v_weekly, v_monthly,
    v_approved, v_penalty, (v_approved - v_penalty), now()
  )
  ON CONFLICT (user_email, score_date)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    daily_score = EXCLUDED.daily_score,
    weekly_score = EXCLUDED.weekly_score,
    monthly_score = EXCLUDED.monthly_score,
    approved_points = EXCLUDED.approved_points,
    missed_penalty = EXCLUDED.missed_penalty,
    net_score = EXCLUDED.net_score,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_task_instances_for_date(
  p_target_date date DEFAULT CURRENT_DATE
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  WITH expanded AS (
    SELECT
      tt.id AS template_id,
      tt.task_type,
      COALESCE(tt.assigned_user_id, u.id) AS assigned_to_user_id,
      lower(trim(COALESCE(tt.assigned_email, u.email))) AS assigned_to_email,
      CASE
        WHEN tt.task_type = 'daily' THEN p_target_date
        WHEN tt.task_type = 'weekly' THEN date_trunc('week', p_target_date)::date
        WHEN tt.task_type = 'monthly' THEN date_trunc('month', p_target_date)::date
      END AS period_start_date,
      CASE
        WHEN tt.task_type = 'daily' THEN p_target_date
        WHEN tt.task_type = 'weekly' THEN (date_trunc('week', p_target_date)::date + 6)
        WHEN tt.task_type = 'monthly' THEN ((date_trunc('month', p_target_date) + INTERVAL '1 month - 1 day')::date)
      END AS period_end_date,
      CASE
        WHEN tt.task_type = 'daily' THEN (p_target_date::timestamp + TIME '23:59:59')
        WHEN tt.task_type = 'weekly' THEN ((date_trunc('week', p_target_date)::date + 6)::timestamp + TIME '23:59:59')
        WHEN tt.task_type = 'monthly' THEN (((date_trunc('month', p_target_date) + INTERVAL '1 month - 1 day')::date)::timestamp + TIME '23:59:59')
      END AS due_date
    FROM public.task_templates tt
    LEFT JOIN public.roles r ON r.code = tt.assigned_role_code
    LEFT JOIN public.users u
      ON (
        (tt.assigned_user_id IS NULL AND tt.assigned_email IS NULL AND tt.assigned_role_code IS NOT NULL AND u.role_id = r.id)
        OR (tt.assigned_user_id = u.id)
        OR (tt.assigned_email IS NOT NULL AND lower(trim(u.email)) = lower(trim(tt.assigned_email)))
      )
    WHERE tt.is_active = true
  ), prepared AS (
    SELECT *
    FROM expanded
    WHERE assigned_to_email IS NOT NULL
      AND assigned_to_email <> ''
  ), inserted AS (
    INSERT INTO public.task_instances (
      template_id, assigned_to_user_id, assigned_to_email,
      period_start_date, period_end_date, due_date, status
    )
    SELECT
      p.template_id,
      p.assigned_to_user_id,
      p.assigned_to_email,
      p.period_start_date,
      p.period_end_date,
      p.due_date,
      'pending'
    FROM prepared p
    ON CONFLICT (template_id, assignee_key, period_start_date) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;

  RETURN COALESCE(v_inserted, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_task_instance(
  p_task_instance_id uuid,
  p_submission_link text DEFAULT NULL,
  p_submission_notes text DEFAULT NULL
)
RETURNS public.task_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.task_instances;
  v_required boolean;
BEGIN
  SELECT ti.*, tt.required_proof
  INTO v_row
  FROM public.task_instances ti
  JOIN public.task_templates tt ON tt.id = ti.template_id
  WHERE ti.id = p_task_instance_id;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Task instance not found';
  END IF;

  v_required := COALESCE(v_row.required_proof, false);
  IF v_required AND COALESCE(trim(p_submission_link), '') = '' THEN
    RAISE EXCEPTION 'Proof link/file is required for this task';
  END IF;

  IF v_row.status = 'approved' THEN
    RAISE EXCEPTION 'Approved task cannot be resubmitted';
  END IF;

  UPDATE public.task_instances
  SET
    submission_link = NULLIF(trim(COALESCE(p_submission_link, '')), ''),
    submission_notes = p_submission_notes,
    submitted_at = now(),
    status = 'submitted',
    is_late = now() > due_date,
    rejection_reason = NULL
  WHERE id = p_task_instance_id
  RETURNING * INTO v_row;

  INSERT INTO public.task_audit_log (
    task_instance_id, action, actor_user_id, actor_email, payload
  ) VALUES (
    p_task_instance_id,
    'TASK_SUBMITTED',
    auth.uid(),
    public.current_user_email(),
    jsonb_build_object('submission_link', p_submission_link, 'submission_notes', p_submission_notes)
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_task_instance(
  p_task_instance_id uuid
)
RETURNS public.task_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.task_instances;
BEGIN
  UPDATE public.task_instances
  SET
    status = 'approved',
    approved_by = auth.uid(),
    approved_by_email = public.current_user_email(),
    approved_at = now(),
    rejection_reason = NULL
  WHERE id = p_task_instance_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Task instance not found';
  END IF;

  PERFORM public.recompute_user_score_for_date(v_row.assigned_to_email, v_row.period_start_date);

  INSERT INTO public.task_audit_log (
    task_instance_id, action, actor_user_id, actor_email, payload
  ) VALUES (
    p_task_instance_id,
    'TASK_APPROVED',
    auth.uid(),
    public.current_user_email(),
    jsonb_build_object('approved_at', now())
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_task_instance(
  p_task_instance_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS public.task_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.task_instances;
BEGIN
  UPDATE public.task_instances
  SET
    status = 'rejected',
    approved_by = auth.uid(),
    approved_by_email = public.current_user_email(),
    approved_at = now(),
    rejection_reason = NULLIF(trim(COALESCE(p_reason, '')), '')
  WHERE id = p_task_instance_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Task instance not found';
  END IF;

  PERFORM public.recompute_user_score_for_date(v_row.assigned_to_email, v_row.period_start_date);

  INSERT INTO public.task_audit_log (
    task_instance_id, action, actor_user_id, actor_email, payload
  ) VALUES (
    p_task_instance_id,
    'TASK_REJECTED',
    auth.uid(),
    public.current_user_email(),
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_row;
END;
$$;

-- -----------------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_templates_admin_all" ON public.task_templates;
CREATE POLICY "task_templates_admin_all"
  ON public.task_templates
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin_fallback())
  WITH CHECK (public.current_user_is_admin_fallback());

DROP POLICY IF EXISTS "task_templates_select_all" ON public.task_templates;
CREATE POLICY "task_templates_select_all"
  ON public.task_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "task_instances_admin_all" ON public.task_instances;
CREATE POLICY "task_instances_admin_all"
  ON public.task_instances
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin_fallback())
  WITH CHECK (public.current_user_is_admin_fallback());

DROP POLICY IF EXISTS "task_instances_select_own" ON public.task_instances;
CREATE POLICY "task_instances_select_own"
  ON public.task_instances
  FOR SELECT
  TO authenticated
  USING (
    lower(trim(COALESCE(assigned_to_email, ''))) = public.current_user_email()
    OR assigned_to_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "task_instances_update_own_submit" ON public.task_instances;
CREATE POLICY "task_instances_update_own_submit"
  ON public.task_instances
  FOR UPDATE
  TO authenticated
  USING (
    lower(trim(COALESCE(assigned_to_email, ''))) = public.current_user_email()
    OR assigned_to_user_id = auth.uid()
  )
  WITH CHECK (
    lower(trim(COALESCE(assigned_to_email, ''))) = public.current_user_email()
    OR assigned_to_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "task_submissions_admin_all" ON public.task_submissions;
CREATE POLICY "task_submissions_admin_all"
  ON public.task_submissions
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin_fallback())
  WITH CHECK (public.current_user_is_admin_fallback());

DROP POLICY IF EXISTS "task_submissions_select_own" ON public.task_submissions;
CREATE POLICY "task_submissions_select_own"
  ON public.task_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.task_instances ti
      WHERE ti.id = task_submissions.task_instance_id
        AND (
          lower(trim(COALESCE(ti.assigned_to_email, ''))) = public.current_user_email()
          OR ti.assigned_to_user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "task_submissions_insert_own" ON public.task_submissions;
CREATE POLICY "task_submissions_insert_own"
  ON public.task_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.task_instances ti
      WHERE ti.id = task_submissions.task_instance_id
        AND (
          lower(trim(COALESCE(ti.assigned_to_email, ''))) = public.current_user_email()
          OR ti.assigned_to_user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "user_scores_admin_all" ON public.user_scores;
CREATE POLICY "user_scores_admin_all"
  ON public.user_scores
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin_fallback())
  WITH CHECK (public.current_user_is_admin_fallback());

DROP POLICY IF EXISTS "user_scores_select_own" ON public.user_scores;
CREATE POLICY "user_scores_select_own"
  ON public.user_scores
  FOR SELECT
  TO authenticated
  USING (lower(trim(user_email)) = public.current_user_email());

DROP POLICY IF EXISTS "task_audit_log_admin_read" ON public.task_audit_log;
CREATE POLICY "task_audit_log_admin_read"
  ON public.task_audit_log
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin_fallback());

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_is_admin_fallback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin_fallback() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.recompute_user_score_for_date(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_user_score_for_date(text, date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.generate_task_instances_for_date(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_task_instances_for_date(date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_task_instance(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_task_instance(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.approve_task_instance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_task_instance(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reject_task_instance(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_task_instance(uuid, text) TO authenticated, service_role;

COMMIT;

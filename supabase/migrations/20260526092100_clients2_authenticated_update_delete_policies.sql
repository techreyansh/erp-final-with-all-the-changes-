ALTER TABLE public.clients2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.clients2;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.clients2;

CREATE POLICY "Allow authenticated delete"
ON public.clients2
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update"
ON public.clients2
FOR UPDATE
TO authenticated
USING (true);

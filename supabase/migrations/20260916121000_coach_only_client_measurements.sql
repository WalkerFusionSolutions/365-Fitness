-- Remove client measurement creation while preserving client history access
-- and all existing coach/privileged measurement policies.

DROP POLICY IF EXISTS "Clients can insert own measurements"
  ON public.measurements;

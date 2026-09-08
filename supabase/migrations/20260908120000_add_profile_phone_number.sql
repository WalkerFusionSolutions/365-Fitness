-- Add optional profile phone numbers for contact information only.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

-- Preserve secure profile creation while storing optional phone metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone_number)
  VALUES (
    NEW.id,
    'client'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'phone_number'), '')
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- FIX: Supabase Auth "Database error saving new user"
-- Problem: 
-- 1. handle_new_user() ran without SET search_path = public, causing PostgreSQL
--    to fail resolving type "user_role" within auth.users execution context.
-- 2. Direct cast (raw_user_meta_data->>'role')::user_role failed if null or invalid.
-- 3. Lack of EXCEPTION block aborted auth.users transaction completely.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'ParKit Member'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'::public.user_role
      ELSE 'driver'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure permissions
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

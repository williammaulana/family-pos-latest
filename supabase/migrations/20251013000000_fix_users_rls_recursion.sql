-- Fix infinite recursion in RLS policies for users table

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Super admin can insert users" ON users;
DROP POLICY IF EXISTS "Super admin can delete users" ON users;
DROP POLICY IF EXISTS "Allow read access for authentication" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Ensure the security definer function is created
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Recreate policies using the security definer function
CREATE POLICY "Allow read access for authentication"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

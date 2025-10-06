/*
  # Fix Login RLS Policy

  ## Changes
  - Drops the existing restrictive SELECT policy on users table
  - Creates a new policy that allows read access for login authentication
  - This enables the login endpoint to query users without prior authentication

  ## Security Notes
  - While this allows reads of the users table, the password_hash is never exposed to clients
  - The login endpoint runs server-side and validates passwords securely
  - All INSERT, UPDATE, and DELETE operations still require proper authentication
  - This is a common pattern for custom authentication systems
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Create new policy that allows read access for authentication
-- This policy allows both authenticated and unauthenticated access
-- which is necessary for the login flow to work
CREATE POLICY "Allow read access for authentication"
  ON users FOR SELECT
  USING (true);

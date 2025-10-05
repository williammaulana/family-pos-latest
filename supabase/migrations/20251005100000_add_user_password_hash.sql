/*
  Ensure users.password_hash exists and is populated
  - Adds password_hash column if missing
  - Backfills default hash for existing rows
  - Attempts to enforce NOT NULL once backfilled
*/

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Backfill with bcrypt hash for "password"
UPDATE public.users
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL;

-- Set NOT NULL constraint if safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE password_hash IS NULL
  ) THEN
    ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
  END IF;
END $$;
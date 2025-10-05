-- Backfill password_hash for any users missing a hash (Postgres/Supabase)
UPDATE public.users
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL;
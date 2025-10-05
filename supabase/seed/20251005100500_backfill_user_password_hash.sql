-- Backfill password_hash for any users missing a hash (Postgres/Supabase)
UPDATE public.users
SET password_hash = '$2y$10$2LsVYo6Mid1LkohJdUDMeeLKvS5eiU5MsP/mnouNEJSRQAbQgLcPC'
WHERE password_hash IS NULL;

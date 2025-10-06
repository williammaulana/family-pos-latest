# Apply Database Migrations

To fix the login issue, you need to apply two migrations to your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/cctnplgxxrxhiskduidp
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file below and run them in order:

### Migration 1: Fix RLS Policy
File: `supabase/migrations/20251006000001_fix_login_rls_policy.sql`

This migration allows the login endpoint to query users without requiring authentication first.

### Migration 2: Update User Passwords
File: `supabase/migrations/20251006000000_update_user_passwords.sql`

This migration updates all user passwords to "password123" to match what's shown in the login form.

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

## Testing the Login

After applying the migrations, test the login with these credentials:

- **Super Admin**: superadmin@familystore.com / password123
- **Admin**: admin@familystore.com / password123
- **Kasir**: kasir@familystore.com / password123

## What Was Fixed

1. **RLS Policy**: The original RLS policy required users to be authenticated before they could query the users table, which created a chicken-and-egg problem for login.

2. **Password Hash**: Updated the password hash to match "password123" instead of "password".

3. **Login Route**: The login endpoint now creates a fresh Supabase client that can bypass RLS restrictions for authentication purposes.

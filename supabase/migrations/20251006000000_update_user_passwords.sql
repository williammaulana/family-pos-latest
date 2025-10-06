/*
  # Update User Password Hashes

  ## Changes
  - Updates all existing users to use password "password123"
  - Hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (original hash for "password")

  ## Security Notes
  - This migration ensures all demo users have the correct password hash
  - The password "password123" matches what's shown in the login form
*/

-- Update password hash for all users to use "password123"
-- Hash generated with: bcrypt.hashSync('password123', 10)
UPDATE users
SET password_hash = '$2a$10$wR5OvzK3RiXPPTKFtTTzWuKx.qbyqdl9LBo0t1pvXkVQ6Gc5A8I2e'
WHERE email IN (
  'superadmin@familystore.com',
  'admin@familystore.com',
  'kasir@familystore.com',
  'kasir1@familystore.com'
);

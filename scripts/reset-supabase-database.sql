-- ===========================================
-- FAMILY STORE POS - SUPABASE DATABASE RESET
-- ===========================================
-- This script completely resets the database, applies all migrations,
-- and seeds fresh data for development/testing purposes.
--
-- WARNING: This will DELETE ALL EXISTING DATA!
-- Only run this in development environments.
--
-- Usage: Run this script in Supabase SQL Editor or via CLI
-- ===========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- STEP 1: DROP ALL EXISTING TABLES (in reverse dependency order)
-- ===========================================

-- Drop triggers first
DROP TRIGGER IF EXISTS surat_jalan_approve_sync ON public.surat_jalan;
DROP TRIGGER IF EXISTS penerimaan_approve_sync ON public.penerimaan_barang;

-- Drop functions
DROP FUNCTION IF EXISTS public.trg_surat_jalan_approve_sync_stock();
DROP FUNCTION IF EXISTS public.trg_penerimaan_approve_sync_stock();
DROP FUNCTION IF EXISTS public.ensure_product_stock_row(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.insert_product_admin(text, text, integer, integer, integer, text, text, text, integer, text, text);
DROP FUNCTION IF EXISTS public.ensure_category_by_name(text);

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.surat_jalan_items CASCADE;
DROP TABLE IF EXISTS public.surat_jalan CASCADE;
DROP TABLE IF EXISTS public.penerimaan_barang_items CASCADE;
DROP TABLE IF EXISTS public.penerimaan_barang CASCADE;
DROP TABLE IF EXISTS public.product_stocks CASCADE;
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.migrations CASCADE;

-- ===========================================
-- STEP 2: APPLY MIGRATIONS IN CHRONOLOGICAL ORDER
-- ===========================================

-- Migration 1: 20251002160742_create_pos_tables.sql
-- Create warehouses and stores first (extracted from later migration due to dependencies)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null check (role in ('super_admin', 'admin', 'kasir', 'admin_gudang', 'admin_toko', 'staff')),
  warehouse_id uuid references warehouses(id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_location_chk check (
    (warehouse_id is not null and store_id is null) or
    (warehouse_id is null and store_id is not null) or
    (warehouse_id is null and store_id is null)
  )
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete cascade,
  price integer not null,
  stock integer not null default 0,
  min_stock integer not null default 10,
  barcode text unique,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_code text unique not null,
  customer_name text,
  customer_phone text,
  total_amount integer not null,
  tax_amount integer not null default 0,
  payment_method text not null check (payment_method in ('tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet')),
  payment_amount integer not null,
  change_amount integer not null default 0,
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  cashier_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null,
  created_at timestamptz not null default now()
);

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
  id integer not null,
  name text not null,
  executed_at timestamptz not null default now(),
  primary key (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);

-- Migration 2: 20251003120000_extend_pos_features.sql
-- Add transaction-level discount and extend payment methods
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount integer not null default 0;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('tunai','kartu_debit','kartu_kredit','e_wallet','qris','transfer_bank'));

-- Add item-level discount column
ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS discount integer not null default 0;

-- Migration 3: 20251005100000_add_user_password_hash.sql
-- Add secure auth and richer product fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text null;

-- Seed default password hash ("password") for existing demo users if missing
UPDATE users
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL;

-- Categories metadata
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;

-- Product metadata
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price integer not null default 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text null;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text null;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text null;

-- Store gateway metadata on transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata text null;

-- Migration 4: 20251006000000_update_user_passwords.sql
-- Update user passwords to "password123"
UPDATE public.users
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL OR password_hash != '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- Migration 5: 20251006000001_fix_login_rls_policy.sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow login queries (bypass RLS for auth)
CREATE POLICY "Allow login queries" ON users
  FOR SELECT USING (true);

-- Allow authenticated users to read/update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow super_admin and admin to manage all users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Migration 6: 20251006165738_create_pos_tables.sql
-- (This appears to be a duplicate/replacement of the initial tables, but we'll skip as tables already exist)

-- Migration 7: 20251009120000_multi_location_and_docs.sql
-- Tabel master (warehouses and stores already created in Migration 1)

-- Stok per lokasi (gudang ATAU toko)
CREATE TABLE IF NOT EXISTS public.product_stocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  stock integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint one_location_chk check (
    (warehouse_id is not null and store_id is null) or
    (warehouse_id is null and store_id is not null)
  ),
  constraint uniq_location unique (product_id, warehouse_id, store_id)
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  type text not null check (type in ('in','out','transfer')),
  quantity integer not null check (quantity >= 0),
  ref_id uuid,
  ref_type text check (ref_type in ('penerimaan','surat_jalan','penyesuaian')),
  created_at timestamptz not null default now()
);

-- Dokumen Surat Jalan
CREATE TABLE IF NOT EXISTS public.surat_jalan (
  id uuid primary key default gen_random_uuid(),
  nomor text unique not null,
  dari_gudang_id uuid not null references public.warehouses(id) on delete restrict,
  ke_gudang_id uuid references public.warehouses(id) on delete set null,
  ke_toko_id uuid references public.stores(id) on delete set null,
  sopir text,
  nomor_kendaraan text,
  tanggal date not null,
  status text not null default 'Draft' check (status in ('Draft','Disetujui','Dibatalkan')),
  dibuat_oleh uuid not null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.surat_jalan_items (
  id uuid primary key default gen_random_uuid(),
  surat_jalan_id uuid not null references public.surat_jalan(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text
);

-- Dokumen Penerimaan Barang
CREATE TABLE IF NOT EXISTS public.penerimaan_barang (
  id uuid primary key default gen_random_uuid(),
  nomor text unique not null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  pemasok text,
  tanggal date not null,
  status text not null default 'Draft' check (status in ('Draft','Disetujui','Dibatalkan')),
  dibuat_oleh uuid not null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.penerimaan_barang_items (
  id uuid primary key default gen_random_uuid(),
  penerimaan_id uuid not null references public.penerimaan_barang(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text
);

-- Utility function to ensure category exists by name (bypass RLS)
CREATE OR REPLACE FUNCTION public.ensure_category_by_name(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.categories WHERE name = p_name LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.categories (name) VALUES (p_name) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- Allow RPC execution from API roles
GRANT EXECUTE ON FUNCTION public.ensure_category_by_name(text) TO anon, authenticated, service_role;

-- Upsert helper: memastikan baris stok ada
CREATE OR REPLACE FUNCTION public.ensure_product_stock_row(p_product_id uuid, p_warehouse_id uuid, p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.product_stocks (product_id, warehouse_id, store_id, stock)
  VALUES (p_product_id, p_warehouse_id, p_store_id, 0)
  ON CONFLICT (product_id, warehouse_id, store_id) DO NOTHING;
END;
$$;

-- Trigger Penerimaan: saat disetujui, tambah stok di gudang penerima
CREATE OR REPLACE FUNCTION public.trg_penerimaan_approve_sync_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r_item record;
BEGIN
  IF (TG_OP = 'UPDATE') AND (NEW.status = 'Disetujui') AND (OLD.status IS DISTINCT FROM 'Disetujui') THEN
    FOR r_item IN
      SELECT i.product_id, i.quantity FROM public.penerimaan_barang_items i WHERE i.penerimaan_id = NEW.id
    LOOP
      PERFORM public.ensure_product_stock_row(r_item.product_id, NEW.warehouse_id, NULL);
      UPDATE public.product_stocks
        SET stock = stock + r_item.quantity, updated_at = now()
        WHERE product_id = r_item.product_id AND warehouse_id = NEW.warehouse_id AND store_id IS NULL;

      INSERT INTO public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
      VALUES (r_item.product_id, NEW.warehouse_id, NULL, 'in', r_item.quantity, NEW.id, 'penerimaan');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER penerimaan_approve_sync
AFTER UPDATE ON public.penerimaan_barang
FOR EACH ROW EXECUTE FUNCTION public.trg_penerimaan_approve_sync_stock();

-- Trigger Surat Jalan: saat disetujui, kurangi stok dari gudang asal, tambah stok ke gudang/toko tujuan
CREATE OR REPLACE FUNCTION public.trg_surat_jalan_approve_sync_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r_item record;
  trg_wh uuid;
  trg_store uuid;
BEGIN
  IF (TG_OP = 'UPDATE') AND (NEW.status = 'Disetujui') AND (OLD.status IS DISTINCT FROM 'Disetujui') THEN
    FOR r_item IN
      SELECT i.product_id, i.quantity FROM public.surat_jalan_items i WHERE i.surat_jalan_id = NEW.id
    LOOP
      -- kurangi gudang asal
      PERFORM public.ensure_product_stock_row(r_item.product_id, NEW.dari_gudang_id, NULL);
      UPDATE public.product_stocks
        SET stock = GREATEST(0, stock - r_item.quantity), updated_at = now()
        WHERE product_id = r_item.product_id AND warehouse_id = NEW.dari_gudang_id AND store_id IS NULL;

      INSERT INTO public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
      VALUES (r_item.product_id, NEW.dari_gudang_id, NULL, 'out', r_item.quantity, NEW.id, 'surat_jalan');

      -- tambah tujuan
      trg_wh := NEW.ke_gudang_id;
      trg_store := NEW.ke_toko_id;

      IF trg_wh IS NOT NULL THEN
        PERFORM public.ensure_product_stock_row(r_item.product_id, trg_wh, NULL);
        UPDATE public.product_stocks
          SET stock = stock + r_item.quantity, updated_at = now()
          WHERE product_id = r_item.product_id AND warehouse_id = trg_wh AND store_id IS NULL;

        INSERT INTO public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        VALUES (r_item.product_id, trg_wh, NULL, 'in', r_item.quantity, NEW.id, 'surat_jalan');
      ELSIF trg_store IS NOT NULL THEN
        PERFORM public.ensure_product_stock_row(r_item.product_id, NULL, trg_store);
        UPDATE public.product_stocks
          SET stock = stock + r_item.quantity, updated_at = now()
          WHERE product_id = r_item.product_id AND store_id = trg_store AND warehouse_id IS NULL;

        INSERT INTO public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        VALUES (r_item.product_id, NULL, trg_store, 'in', r_item.quantity, NEW.id, 'surat_jalan');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER surat_jalan_approve_sync
AFTER UPDATE ON public.surat_jalan
FOR EACH ROW EXECUTE FUNCTION public.trg_surat_jalan_approve_sync_stock();

-- Admin product insert that bypasses RLS via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.insert_product_admin(
  p_name text,
  p_category_name text,
  p_price integer,
  p_stock integer default 0,
  p_min_stock integer default 5,
  p_sku text default null,
  p_barcode text default null,
  p_image_url text default null,
  p_cost_price integer default 0,
  p_unit text default null,
  p_description text default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id uuid;
  v_id uuid;
BEGIN
  IF p_category_name IS NULL OR LENGTH(TRIM(p_category_name)) = 0 THEN
    RAISE EXCEPTION 'Category name is required';
  END IF;
  v_category_id := public.ensure_category_by_name(TRIM(p_category_name));

  INSERT INTO public.products (
    name, category_id, price, stock, min_stock, sku, barcode, image_url, cost_price, unit, description
  ) VALUES (
    p_name, v_category_id, GREATEST(0, p_price), GREATEST(0, COALESCE(p_stock,0)), GREATEST(0, COALESCE(p_min_stock,5)),
    p_sku, p_barcode, p_image_url, GREATEST(0, COALESCE(p_cost_price,0)), p_unit, p_description
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Allow RPC execution from API roles
GRANT EXECUTE ON FUNCTION public.insert_product_admin(
  text, text, integer, integer, integer, text, text, text, integer, text, text
) TO anon, authenticated, service_role;

-- ===========================================
-- STEP 3: APPLY SEEDS
-- ===========================================

-- Seed 1: 20251003121500_seed_pos_data.sql
-- Users (no passwords here; manage auth via Supabase Auth separately)
INSERT INTO users (id, email, name, role, password_hash)
VALUES
  (gen_random_uuid(), 'superadmin@familystore.com', 'Super Admin', 'super_admin', '$2a$10$wR5OvzK3RiXPPTKFtTTzWuKx.qbyqdl9LBo0t1pvXkVQ6Gc5A8I2e'),
  (gen_random_uuid(), 'admin@familystore.com', 'Admin Store', 'admin', '$2a$10$wR5OvzK3RiXPPTKFtTTzWuKx.qbyqdl9LBo0t1pvXkVQ6Gc5A8I2e'),
  (gen_random_uuid(), 'kasir1@familystore.com', 'Kasir Satu', 'kasir', '$2a$10$wR5OvzK3RiXPPTKFtTTzWuKx.qbyqdl9LBo0t1pvXkVQ6Gc5A8I2e')
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, created_at)
VALUES
  (gen_random_uuid(), 'Makanan', now()),
  (gen_random_uuid(), 'Minuman', now()),
  (gen_random_uuid(), 'Snack', now()),
  (gen_random_uuid(), 'Peralatan Rumah Tangga', now()),
  (gen_random_uuid(), 'Kesehatan', now()),
  (gen_random_uuid(), 'Kecantikan', now())
ON CONFLICT DO NOTHING;

-- Products linked by category name
WITH cat AS (
  SELECT id, name FROM categories
)
INSERT INTO products (id, name, category_id, price, stock, min_stock, barcode)
SELECT gen_random_uuid(), product_name, c.id, price, stock, min_stock, barcode
FROM (
  VALUES
    ('Indomie Goreng', 'Makanan', 3500, 150, 20, '8992388101010'),
    ('Aqua 600ml', 'Minuman', 3000, 200, 50, '8992388201010'),
    ('Chitato Sapi Panggang', 'Snack', 8500, 75, 15, '8992388301010'),
    ('Sabun Mandi Lifebuoy', 'Kesehatan', 4500, 100, 25, '8992388401010'),
    ('Shampoo Pantene', 'Kecantikan', 15000, 50, 10, '8992388501010'),
    ('Teh Botol Sosro', 'Minuman', 4000, 120, 30, '8992388601010'),
    ('Beras Premium 5kg', 'Makanan', 65000, 25, 5, '8992388701010'),
    ('Deterjen Rinso', 'Peralatan Rumah Tangga', 12000, 80, 15, '8992388801010'),
    ('Kopi Kapal Api', 'Minuman', 2500, 200, 40, '8992388901010'),
    ('Minyak Goreng Tropical', 'Makanan', 18000, 60, 10, '8992389001010')
) p(product_name, category_name, price, stock, min_stock, barcode)
JOIN cat c ON c.name = p.category_name
ON CONFLICT (barcode) DO NOTHING;

-- Seed master warehouses and stores
INSERT INTO warehouses (id, code, name, address)
VALUES
  (gen_random_uuid(), 'WH-01', 'Gudang Pusat', 'Jl. Industri No. 1'),
  (gen_random_uuid(), 'WH-02', 'Gudang Cabang', 'Jl. Logistik No. 2')
ON CONFLICT (code) DO NOTHING;

WITH wh AS (
  SELECT id, code FROM warehouses
)
INSERT INTO stores (id, code, name, address, warehouse_id)
SELECT gen_random_uuid(), s.code, s.name, s.address, w.id
FROM (
  VALUES
    ('ST-01', 'Toko A', 'Jl. Raya 123', 'WH-01'),
    ('ST-02', 'Toko B', 'Jl. Melati 45', 'WH-01'),
    ('ST-03', 'Toko C', 'Jl. Mawar 67', 'WH-02')
) s(code, name, address, wh_code)
JOIN wh w ON w.code = s.wh_code
ON CONFLICT (code) DO NOTHING;

-- Seed 2: 20251005100500_backfill_user_password_hash.sql
-- Backfill password_hash for any users missing a hash (Postgres/Supabase)
UPDATE public.users
SET password_hash = '$2a$10$wR5OvzK3RiXPPTKFtTTzWuKx.qbyqdl9LBo0t1pvXkVQ6Gc5A8I2e'
WHERE password_hash IS NULL;

-- ===========================================
-- STEP 4: RECORD MIGRATIONS AS EXECUTED
-- ===========================================

-- Record all migrations as executed
INSERT INTO migrations (id, name) VALUES
  (1, 'create_pos_tables'),
  (2, 'extend_pos_features'),
  (3, 'add_user_password_hash'),
  (4, 'update_user_passwords'),
  (5, 'fix_login_rls_policy'),
  (6, 'create_pos_tables_duplicate'),
  (7, 'multi_location_and_docs')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- STEP 5: CREATE INITIAL PRODUCT STOCK ENTRIES
-- ===========================================

-- Initialize product stocks for all warehouses and stores with existing products
INSERT INTO product_stocks (product_id, warehouse_id, store_id, stock)
SELECT
  p.id as product_id,
  w.id as warehouse_id,
  NULL as store_id,
  CASE WHEN w.code = 'WH-01' THEN p.stock ELSE 0 END as stock
FROM products p
CROSS JOIN warehouses w
ON CONFLICT (product_id, warehouse_id, store_id) DO NOTHING;

INSERT INTO product_stocks (product_id, warehouse_id, store_id, stock)
SELECT
  p.id as product_id,
  NULL as warehouse_id,
  s.id as store_id,
  0 as stock
FROM products p
CROSS JOIN stores s
ON CONFLICT (product_id, warehouse_id, store_id) DO NOTHING;

-- ===========================================
-- RESET COMPLETE
-- ===========================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'FAMILY STORE POS DATABASE RESET COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Database has been reset with:';
  RAISE NOTICE '- All tables dropped and recreated';
  RAISE NOTICE '- All migrations applied';
  RAISE NOTICE '- Fresh seed data inserted';
  RAISE NOTICE '- Product stocks initialized';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '- Super Admin: superadmin@familystore.com / password123';
  RAISE NOTICE '- Admin: admin@familystore.com / password123';
  RAISE NOTICE '- Kasir: kasir1@familystore.com / password123';
  RAISE NOTICE '===========================================';
END $$;

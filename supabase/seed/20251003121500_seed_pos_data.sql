-- Seed basic POS data for Supabase/Postgres
-- Users (no passwords here; manage auth via Supabase Auth separately)
INSERT INTO users (id, email, name, role, password_hash)
VALUES
  (uuid_generate_v4(), 'superadmin@familystore.com', 'Super Admin', 'super_admin', '$2y$10$2LsVYo6Mid1LkohJdUDMeeLKvS5eiU5MsP/mnouNEJSRQAbQgLcPC'),
  (uuid_generate_v4(), 'admin@familystore.com', 'Admin Store', 'admin', '$2y$10$2LsVYo6Mid1LkohJdUDMeeLKvS5eiU5MsP/mnouNEJSRQAbQgLcPC'),
  (uuid_generate_v4(), 'kasir1@familystore.com', 'Kasir Satu', 'kasir', '$2y$10$2LsVYo6Mid1LkohJdUDMeeLKvS5eiU5MsP/mnouNEJSRQAbQgLcPC')
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, created_at)
VALUES
  (uuid_generate_v4(), 'Makanan', now()),
  (uuid_generate_v4(), 'Minuman', now()),
  (uuid_generate_v4(), 'Snack', now()),
  (uuid_generate_v4(), 'Peralatan Rumah Tangga', now()),
  (uuid_generate_v4(), 'Kesehatan', now()),
  (uuid_generate_v4(), 'Kecantikan', now())
ON CONFLICT DO NOTHING;

-- Products linked by category name
WITH cat AS (
  SELECT id, name FROM categories
)
INSERT INTO products (id, name, category_id, price, stock, min_stock, barcode)
SELECT uuid_generate_v4(), product_name, c.id, price, stock, min_stock, barcode
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

-- Optional: create a few sample transactions (without strict FK dependencies on existing random users/products)
-- This is kept minimal; the app will create real transactions via API.


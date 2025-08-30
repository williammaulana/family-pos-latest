-- Insert users
INSERT INTO users (email, name, role) VALUES
('superadmin@familystore.com', 'Super Admin', 'super_admin'),
('admin@familystore.com', 'Admin Store', 'admin'),
('kasir1@familystore.com', 'Kasir Satu', 'kasir'),
('kasir2@familystore.com', 'Kasir Dua', 'kasir')
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO categories (name) VALUES
('Makanan'),
('Minuman'),
('Snack'),
('Peralatan Rumah Tangga'),
('Kesehatan'),
('Kecantikan')
ON CONFLICT DO NOTHING;

-- Get category IDs for products
WITH category_ids AS (
    SELECT id, name FROM categories
)
-- Insert products
INSERT INTO products (name, category_id, price, stock, min_stock, barcode) 
SELECT 
    product_name,
    cat.id,
    price,
    stock,
    min_stock,
    barcode
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
    ('Minyak Goreng Tropical', 'Makanan', 18000, 60, 10, '8992389001010'),
    ('Susu Ultra Milk', 'Minuman', 6500, 90, 20, '8992389101010'),
    ('Pasta Gigi Pepsodent', 'Kesehatan', 8500, 70, 15, '8992389201010')
) AS products_data(product_name, category_name, price, stock, min_stock, barcode)
JOIN category_ids cat ON cat.name = products_data.category_name
ON CONFLICT (barcode) DO NOTHING;

-- Insert sample transactions
WITH user_ids AS (
    SELECT id, name FROM users WHERE role = 'kasir'
),
product_ids AS (
    SELECT id, name, price FROM products
)
INSERT INTO transactions (transaction_code, customer_name, total_amount, tax_amount, payment_method, payment_amount, change_amount, cashier_id, created_at)
SELECT 
    'TRX' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    CASE 
        WHEN random() > 0.5 THEN 'Walk-in Customer'
        ELSE ARRAY['Budi Santoso', 'Siti Aminah', 'Joko Widodo', 'Rina Sari', 'Ahmad Fauzi'][floor(random() * 5 + 1)]
    END,
    total_amount,
    total_amount * 0.1, -- 10% tax
    ARRAY['tunai', 'kartu_debit', 'e_wallet'][floor(random() * 3 + 1)]::text,
    total_amount * 1.1, -- payment amount including tax
    CASE 
        WHEN random() > 0.7 THEN (total_amount * 1.1 * 0.1) -- some change
        ELSE 0
    END,
    (SELECT id FROM user_ids ORDER BY random() LIMIT 1),
    NOW() - (random() * interval '30 days')
FROM (
    SELECT 
        generate_series(1, 50) as transaction_num,
        (random() * 200000 + 25000)::numeric(12,2) as total_amount
) t;

-- Insert transaction items for each transaction
WITH transaction_data AS (
    SELECT id as transaction_id FROM transactions
),
product_data AS (
    SELECT id as product_id, price FROM products
)
INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
SELECT 
    t.transaction_id,
    p.product_id,
    quantity,
    p.price,
    quantity * p.price
FROM transaction_data t
CROSS JOIN LATERAL (
    SELECT 
        (SELECT product_id FROM product_data ORDER BY random() LIMIT 1) as product_id,
        floor(random() * 5 + 1)::integer as quantity
    FROM generate_series(1, floor(random() * 8 + 1)::integer)
) items
JOIN product_data p ON p.product_id = items.product_id;

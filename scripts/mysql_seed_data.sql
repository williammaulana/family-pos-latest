-- MySQL Seed Data for InfinityFree
-- Converting PostgreSQL INSERT statements to MySQL format

-- Insert users with explicit UUIDs and default password hash ("password")
-- Note: Run migrations first so `users.password_hash` exists
INSERT IGNORE INTO users (id, email, name, role, password_hash) VALUES
(UUID(), 'superadmin@familystore.com', 'Super Admin', 'super_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(UUID(), 'admin@familystore.com', 'Admin Store', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(UUID(), 'kasir1@familystore.com', 'Kasir Satu', 'kasir', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(UUID(), 'kasir2@familystore.com', 'Kasir Dua', 'kasir', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Ensure all existing users have a default password hash if missing
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL;

-- Insert categories
INSERT IGNORE INTO categories (id, name) VALUES
(UUID(), 'Makanan'),
(UUID(), 'Minuman'),
(UUID(), 'Snack'),
(UUID(), 'Peralatan Rumah Tangga'),
(UUID(), 'Kesehatan'),
(UUID(), 'Kecantikan');

-- Insert products with category references
INSERT IGNORE INTO products (id, name, category_id, price, stock, min_stock, barcode) 
SELECT 
    UUID(),
    product_name,
    cat.id,
    price,
    stock,
    min_stock,
    barcode
FROM (
    SELECT 'Indomie Goreng' as product_name, 'Makanan' as category_name, 3500 as price, 150 as stock, 20 as min_stock, '8992388101010' as barcode
    UNION ALL SELECT 'Aqua 600ml', 'Minuman', 3000, 200, 50, '8992388201010'
    UNION ALL SELECT 'Chitato Sapi Panggang', 'Snack', 8500, 75, 15, '8992388301010'
    UNION ALL SELECT 'Sabun Mandi Lifebuoy', 'Kesehatan', 4500, 100, 25, '8992388401010'
    UNION ALL SELECT 'Shampoo Pantene', 'Kecantikan', 15000, 50, 10, '8992388501010'
    UNION ALL SELECT 'Teh Botol Sosro', 'Minuman', 4000, 120, 30, '8992388601010'
    UNION ALL SELECT 'Beras Premium 5kg', 'Makanan', 65000, 25, 5, '8992388701010'
    UNION ALL SELECT 'Deterjen Rinso', 'Peralatan Rumah Tangga', 12000, 80, 15, '8992388801010'
    UNION ALL SELECT 'Kopi Kapal Api', 'Minuman', 2500, 200, 40, '8992388901010'
    UNION ALL SELECT 'Minyak Goreng Tropical', 'Makanan', 18000, 60, 10, '8992389001010'
    UNION ALL SELECT 'Susu Ultra Milk', 'Minuman', 6500, 90, 20, '8992389101010'
    UNION ALL SELECT 'Pasta Gigi Pepsodent', 'Kesehatan', 8500, 70, 15, '8992389201010'
) AS products_data
JOIN categories cat ON cat.name = products_data.category_name;

-- Insert sample transactions
INSERT IGNORE INTO transactions (id, transaction_code, customer_name, total_amount, tax_amount, payment_method, payment_amount, change_amount, cashier_id, created_at)
SELECT 
    UUID(),
    CONCAT('TRX', LPAD(@row_number := @row_number + 1, 3, '0')),
    CASE 
        WHEN RAND() > 0.5 THEN 'Walk-in Customer'
        ELSE ELT(FLOOR(RAND() * 5) + 1, 'Budi Santoso', 'Siti Aminah', 'Joko Widodo', 'Rina Sari', 'Ahmad Fauzi')
    END,
    ROUND(RAND() * 200000 + 25000, 2),
    ROUND((RAND() * 200000 + 25000) * 0.1, 2),
    ELT(FLOOR(RAND() * 3) + 1, 'tunai', 'kartu_debit', 'e_wallet'),
    ROUND((RAND() * 200000 + 25000) * 1.1, 2),
    CASE 
        WHEN RAND() > 0.7 THEN ROUND((RAND() * 200000 + 25000) * 0.11, 2)
        ELSE 0
    END,
    (SELECT id FROM users WHERE role = 'kasir' ORDER BY RAND() LIMIT 1),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM 
    (SELECT @row_number := 0) r,
    (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
     SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
     SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
     SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
     SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
     SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
     SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
     SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
     SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
     SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50) numbers;

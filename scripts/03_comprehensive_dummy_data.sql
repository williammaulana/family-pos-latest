-- Creating comprehensive dummy data for all tables based on lib/mock-data.ts

-- Insert Users (including cashiers and admins)
INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'superadmin@familystore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Admin Store', 'admin@familystore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Kasir Satu', 'kasir1@familystore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Kasir Dua', 'kasir2@familystore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir', NOW(), NOW());

-- Insert Categories
INSERT INTO categories (id, name, description) VALUES
('cat-001', 'Makanan', 'Produk makanan dan bahan pokok'),
('cat-002', 'Minuman', 'Minuman kemasan dan segar'),
('cat-003', 'Kebersihan', 'Produk kebersihan dan perawatan');

-- Insert Products (matching mock data)
INSERT INTO products (id, name, category_id, price, cost, stock, min_stock, barcode, created_at, updated_at) VALUES
('prod-001', 'Indomie Goreng', 'cat-001', 3500, 2500, 5, 20, '8992388101010', '2025-01-01', '2025-01-15'),
('prod-002', 'Aqua 600ml', 'cat-002', 4000, 3000, 12, 50, '8992771010101', '2025-01-01', '2025-01-15'),
('prod-003', 'Sabun Mandi', 'cat-003', 8500, 6500, 3, 15, '8992388202020', '2025-01-01', '2025-01-15'),
('prod-004', 'Beras 5kg', 'cat-001', 65000, 55000, 25, 10, '8992388303030', '2025-01-01', '2025-01-15'),
('prod-005', 'Minyak Goreng 1L', 'cat-001', 18000, 15000, 8, 15, '8992388404040', '2025-01-01', '2025-01-15'),
('prod-006', 'Teh Botol Sosro', 'cat-002', 5000, 3500, 30, 25, '8992388505050', '2025-01-01', '2025-01-15'),
('prod-007', 'Roti Tawar', 'cat-001', 12000, 9000, 15, 20, '8992388606060', '2025-01-01', '2025-01-15'),
('prod-008', 'Shampo Sachet', 'cat-003', 2500, 1800, 50, 30, '8992388707070', '2025-01-01', '2025-01-15'),
('prod-009', 'Kopi Kapal Api', 'cat-002', 15000, 12000, 20, 15, '8992388808080', '2025-01-01', '2025-01-15'),
('prod-010', 'Gula Pasir 1kg', 'cat-001', 14000, 12000, 18, 12, '8992388909090', '2025-01-01', '2025-01-15');

-- Insert Transactions (comprehensive data for the last 30 days)
INSERT INTO transactions (id, code, customer_name, total, tax, discount, payment_method, payment_amount, change_amount, status, cashier_id, created_at, updated_at) VALUES
('trx-001', 'TRX001', 'Walk-in Customer', 75000, 7500, 0, 'cash', 80000, 5000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-15 14:30:00', '2025-01-15 14:30:00'),
('trx-002', 'TRX002', 'Ibu Siti', 125000, 12500, 0, 'cash', 130000, 5000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-15 14:15:00', '2025-01-15 14:15:00'),
('trx-003', 'TRX003', 'Pak Budi', 45000, 4500, 2000, 'debit', 45000, 0, 'completed', '550e8400-e29b-41d4-a716-446655440004', '2025-01-15 13:45:00', '2025-01-15 13:45:00'),
('trx-004', 'TRX004', 'Ibu Ani', 32000, 3200, 0, 'cash', 35000, 3000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-15 12:30:00', '2025-01-15 12:30:00'),
('trx-005', 'TRX005', 'Walk-in Customer', 89000, 8900, 5000, 'qris', 89000, 0, 'completed', '550e8400-e29b-41d4-a716-446655440004', '2025-01-15 11:20:00', '2025-01-15 11:20:00'),
('trx-006', 'TRX006', 'Pak Joko', 156000, 15600, 0, 'cash', 160000, 4000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-14 16:45:00', '2025-01-14 16:45:00'),
('trx-007', 'TRX007', 'Ibu Maya', 67500, 6750, 2500, 'debit', 67500, 0, 'completed', '550e8400-e29b-41d4-a716-446655440004', '2025-01-14 15:30:00', '2025-01-14 15:30:00'),
('trx-008', 'TRX008', 'Walk-in Customer', 28000, 2800, 0, 'cash', 30000, 2000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-14 14:15:00', '2025-01-14 14:15:00'),
('trx-009', 'TRX009', 'Pak Andi', 95000, 9500, 0, 'qris', 95000, 0, 'completed', '550e8400-e29b-41d4-a716-446655440004', '2025-01-14 13:00:00', '2025-01-14 13:00:00'),
('trx-010', 'TRX010', 'Ibu Rina', 112000, 11200, 8000, 'cash', 115000, 3000, 'completed', '550e8400-e29b-41d4-a716-446655440003', '2025-01-14 10:45:00', '2025-01-14 10:45:00');

-- Insert Transaction Items (matching the transactions above)
INSERT INTO transaction_items (id, transaction_id, product_id, quantity, price, subtotal) VALUES
-- TRX001 items
('item-001', 'trx-001', 'prod-001', 5, 3500, 17500),
('item-002', 'trx-001', 'prod-004', 1, 65000, 65000),

-- TRX002 items  
('item-003', 'trx-002', 'prod-002', 8, 4000, 32000),
('item-004', 'trx-002', 'prod-005', 2, 18000, 36000),
('item-005', 'trx-002', 'prod-003', 3, 8500, 25500),

-- TRX003 items
('item-006', 'trx-003', 'prod-006', 6, 5000, 30000),
('item-007', 'trx-003', 'prod-007', 1, 12000, 12000),
('item-008', 'trx-003', 'prod-008', 4, 2500, 10000),

-- TRX004 items
('item-009', 'trx-004', 'prod-002', 4, 4000, 16000),
('item-010', 'trx-004', 'prod-009', 1, 15000, 15000),

-- TRX005 items
('item-011', 'trx-005', 'prod-004', 1, 65000, 65000),
('item-012', 'trx-005', 'prod-010', 1, 14000, 14000),
('item-013', 'trx-005', 'prod-001', 3, 3500, 10500),

-- TRX006 items
('item-014', 'trx-006', 'prod-005', 3, 18000, 54000),
('item-015', 'trx-006', 'prod-004', 1, 65000, 65000),
('item-016', 'trx-006', 'prod-007', 2, 12000, 24000),
('item-017', 'trx-006', 'prod-010', 1, 14000, 14000),

-- TRX007 items
('item-018', 'trx-007', 'prod-009', 2, 15000, 30000),
('item-019', 'trx-007', 'prod-006', 5, 5000, 25000),
('item-020', 'trx-007', 'prod-008', 5, 2500, 12500),

-- TRX008 items
('item-021', 'trx-008', 'prod-001', 4, 3500, 14000),
('item-022', 'trx-008', 'prod-002', 2, 4000, 8000),
('item-023', 'trx-008', 'prod-008', 2, 2500, 5000),

-- TRX009 items
('item-024', 'trx-009', 'prod-004', 1, 65000, 65000),
('item-025', 'trx-009', 'prod-005', 1, 18000, 18000),
('item-026', 'trx-009', 'prod-010', 1, 14000, 14000),

-- TRX010 items
('item-027', 'trx-010', 'prod-005', 2, 18000, 36000),
('item-028', 'trx-010', 'prod-004', 1, 65000, 65000),
('item-029', 'trx-010', 'prod-009', 1, 15000, 15000),
('item-030', 'trx-010', 'prod-007', 1, 12000, 12000);

-- Update product stock based on sales
UPDATE products SET stock = stock - 20 WHERE id = 'prod-001'; -- Indomie sold 20 total
UPDATE products SET stock = stock - 14 WHERE id = 'prod-002'; -- Aqua sold 14 total  
UPDATE products SET stock = stock - 3 WHERE id = 'prod-003'; -- Sabun sold 3 total
UPDATE products SET stock = stock - 4 WHERE id = 'prod-004'; -- Beras sold 4 total
UPDATE products SET stock = stock - 8 WHERE id = 'prod-005'; -- Minyak sold 8 total
UPDATE products SET stock = stock - 11 WHERE id = 'prod-006'; -- Teh sold 11 total
UPDATE products SET stock = stock - 4 WHERE id = 'prod-007'; -- Roti sold 4 total
UPDATE products SET stock = stock - 11 WHERE id = 'prod-008'; -- Shampo sold 11 total
UPDATE products SET stock = stock - 4 WHERE id = 'prod-009'; -- Kopi sold 4 total
UPDATE products SET stock = stock - 3 WHERE id = 'prod-010'; -- Gula sold 3 total

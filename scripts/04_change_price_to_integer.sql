-- Migration to change price columns from DECIMAL to INTEGER
-- This ensures prices are stored as whole numbers (in rupiah)

-- Change products table price column to INTEGER
ALTER TABLE products CHANGE COLUMN price price INTEGER NOT NULL;

-- Change transactions table amount columns to INTEGER
ALTER TABLE transactions CHANGE COLUMN total_amount total_amount INTEGER NOT NULL;
ALTER TABLE transactions CHANGE COLUMN tax_amount tax_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions CHANGE COLUMN payment_amount payment_amount INTEGER NOT NULL;
ALTER TABLE transactions CHANGE COLUMN change_amount change_amount INTEGER NOT NULL DEFAULT 0;

-- Change transaction_items table price columns to INTEGER
ALTER TABLE transaction_items CHANGE COLUMN unit_price unit_price INTEGER NOT NULL;
ALTER TABLE transaction_items CHANGE COLUMN total_price total_price INTEGER NOT NULL;

-- Note: This migration assumes existing DECIMAL values can be safely converted to INTEGER
-- If you have decimal prices, you may need to round or truncate them first

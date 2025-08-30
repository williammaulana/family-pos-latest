-- Script untuk setup MySQL lokal
-- Jalankan script ini di MySQL Workbench atau command line

-- Buat database
CREATE DATABASE IF NOT EXISTS family_store_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Gunakan database
USE family_store_pos;

-- Buat user khusus untuk aplikasi (opsional, untuk keamanan)
-- CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'pos_password123';
-- GRANT ALL PRIVILEGES ON family_store_pos.* TO 'pos_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Tabel akan dibuat otomatis melalui migration system
SELECT 'Database family_store_pos berhasil dibuat!' as status;

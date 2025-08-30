# Setup Database Lokal untuk Family Store POS

## Pilihan 1: MySQL Lokal (Recommended untuk Development)

### Install MySQL di berbagai OS:

#### Windows:
1. Download MySQL Installer dari: https://dev.mysql.com/downloads/installer/
2. Pilih "MySQL Installer for Windows"
3. Install dengan konfigurasi default
4. Set password root (contoh: `root123`)

#### macOS:
```bash
# Menggunakan Homebrew
brew install mysql
brew services start mysql

# Set password root
mysql_secure_installation
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Setup Database:
1. Login ke MySQL:
```bash
mysql -u root -p
```

2. Jalankan script setup:
```sql
-- Buat database
CREATE DATABASE family_store_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user khusus (opsional)
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'pos_password123';
GRANT ALL PRIVILEGES ON family_store_pos.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;

-- Keluar
EXIT;
```

3. Update file .env.local:
```env
# === LOCAL MYSQL ===
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=family_store_pos
DB_PORT=3306
```

## Pilihan 2: Docker MySQL (Mudah & Portable)

### Install Docker:
- Windows/Mac: Download Docker Desktop
- Linux: `sudo apt install docker.io`

### Jalankan MySQL Container:
```bash
# Buat dan jalankan MySQL container
docker run --name mysql-pos \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=family_store_pos \
  -p 3306:3306 \
  -d mysql:8.0

# Cek status container
docker ps
```

### Update .env.local:
```env
# === DOCKER MYSQL ===
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=family_store_pos
DB_PORT=3306
```

## Test Koneksi:
1. Jalankan aplikasi: `npm run dev`
2. Buka browser: `http://localhost:3000/api/test-connection`
3. Jika berhasil, akan muncul pesan sukses
4. Jalankan migration: `http://localhost:3000/api/migrate`

## Troubleshooting:

### Error "Access denied":
- Periksa username dan password di .env.local
- Pastikan MySQL service berjalan

### Error "Connection refused":
- Pastikan MySQL berjalan di port 3306
- Cek firewall settings

### Error "Unknown database":
- Pastikan database sudah dibuat
- Jalankan script CREATE DATABASE

## Keuntungan MySQL Lokal:
- ✅ Performa sangat cepat
- ✅ Tidak perlu internet
- ✅ Full control atas konfigurasi
- ✅ Ideal untuk development
- ✅ Tidak ada batasan koneksi

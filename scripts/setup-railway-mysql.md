# Setup Railway MySQL (Cloud Gratis)

Railway adalah platform cloud yang menyediakan MySQL gratis dengan performa baik.

## Langkah-langkah Setup Railway:

### 1. Daftar di Railway
- Kunjungi: https://railway.app
- Daftar menggunakan GitHub account
- Verifikasi email Anda

### 2. Buat Project Baru
- Klik "New Project"
- Pilih "Provision MySQL"
- Tunggu hingga database selesai dibuat

### 3. Dapatkan Kredensial Database
- Klik pada MySQL service yang baru dibuat
- Buka tab "Variables"
- Copy kredensial berikut:
  - `MYSQL_HOST`
  - `MYSQL_USER` 
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`
  - `MYSQL_PORT`

### 4. Update .env.local
Ganti bagian Railway di file .env.local dengan kredensial yang didapat:

```env
# === RAILWAY MYSQL (cloud gratis) ===
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=your_railway_password
DB_NAME=railway
DB_PORT=xxxx
```

### 5. Test Koneksi
Jalankan migration untuk test koneksi:
```bash
npm run dev
# Buka http://localhost:3000/api/migrate di browser
```

## Keuntungan Railway:
- ✅ Gratis 500 jam per bulan
- ✅ Performa tinggi
- ✅ SSL otomatis
- ✅ Backup otomatis
- ✅ Monitoring built-in
- ✅ Uptime 99.9%

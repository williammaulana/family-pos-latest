# Setup PlanetScale MySQL (Cloud Gratis dengan Serverless)

PlanetScale adalah database MySQL serverless yang sangat cepat dan mudah digunakan.

## Langkah-langkah Setup PlanetScale:

### 1. Daftar di PlanetScale
- Kunjungi: https://planetscale.com
- Daftar menggunakan GitHub account
- Verifikasi email Anda

### 2. Buat Database Baru
- Klik "Create database"
- Nama database: `family-store-pos`
- Region: pilih yang terdekat (Singapore untuk Indonesia)
- Klik "Create database"

### 3. Buat Branch dan Password
- Setelah database dibuat, klik "Connect"
- Pilih "Create password"
- Nama: `main-password`
- Role: `Admin`
- Klik "Create password"

### 4. Dapatkan Connection String
- Copy connection string yang diberikan
- Format: `mysql://username:password@host/database?sslaccept=strict`

### 5. Update .env.local
Ganti bagian PlanetScale di file .env.local:

```env
# === PLANETSCALE (cloud gratis dengan SSL) ===
DB_HOST=aws.connect.psdb.cloud
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
DB_PORT=3306
DATABASE_URL=mysql://username:password@host:port/database?sslaccept=strict
```

### 6. Install PlanetScale CLI (Opsional)
```bash
# macOS
brew install planetscale/tap/pscale

# Windows
scoop install pscale

# Linux
curl -fsSL https://get.planetscale.com/install.sh | bash
```

### 7. Test Koneksi
```bash
npm run dev
# Buka http://localhost:3000/api/migrate
```

## Keuntungan PlanetScale:
- ✅ Gratis 1 database dengan 1GB storage
- ✅ Serverless (auto-scaling)
- ✅ Branching seperti Git
- ✅ SSL/TLS otomatis
- ✅ Performa sangat tinggi
- ✅ Zero-downtime schema changes
- ✅ Built-in analytics

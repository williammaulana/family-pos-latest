# 📦 Family Store POS - Laravel Implementation

## Daftar File yang Telah Dibuat

Semua file Laravel berada di folder `laravel-files/`

### 📋 Dokumentasi
- ✅ `LARAVEL_SETUP.md` - Panduan setup lengkap
- ✅ `README.md` - Dokumentasi lengkap project
- ✅ `POSTMAN_COLLECTION.json` - Collection untuk testing API

### ⚙️ Configuration Files
- ✅ `.env.example` - Template environment variables
- ✅ `composer.json` - Dependencies Laravel
- ✅ `config/services.php` - Service configuration (Supabase, Xendit)

### 🎯 Core Services
- ✅ `app/Services/SupabaseService.php` - Service untuk integrasi Supabase

### 🎮 Controllers
- ✅ `app/Http/Controllers/AuthController.php` - Login, Register, Logout
- ✅ `app/Http/Controllers/ProductController.php` - CRUD Products
- ✅ `app/Http/Controllers/CategoryController.php` - CRUD Categories
- ✅ `app/Http/Controllers/TransactionController.php` - POS Transactions
- ✅ `app/Http/Controllers/InventoryController.php` - Stock Management
- ✅ `app/Http/Controllers/ReportController.php` - Reports & Analytics
- ✅ `app/Http/Controllers/UserController.php` - User Management

### 🛡️ Middleware
- ✅ `app/Http/Middleware/AuthenticateSupabase.php` - Authentication middleware
- ✅ `app/Http/Middleware/CheckRole.php` - Role-based authorization
- ✅ `app/Http/Kernel.php` - Middleware registration

### 🛣️ Routes
- ✅ `routes/api.php` - All API endpoints

---

## 🚀 Quick Start Guide

### 1. Buat Project Laravel Baru

```bash
composer create-project laravel/laravel family-store-pos
cd family-store-pos
```

### 2. Copy Semua File dari `laravel-files/`

Copy struktur folder berikut ke root project Laravel:

```bash
# Copy semua file dari laravel-files/ ke root project
cp -r laravel-files/* .
```

Atau manual:
- Copy semua file di `laravel-files/app/` ke `app/`
- Copy semua file di `laravel-files/config/` ke `config/`
- Copy semua file di `laravel-files/routes/` ke `routes/`
- Copy `.env.example`
- Copy `composer.json`

### 3. Install Dependencies

```bash
composer install
```

### 4. Setup Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` dan sesuaikan:
```env
SUPABASE_URL=https://mvrbpatykfvxigwsouvs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Run Server

```bash
php artisan serve
```

Server akan berjalan di: `http://localhost:8000`

### 6. Test API

```bash
# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@familystore.com","password":"password123"}'
```

---

## 📚 Struktur File Laravel

```
family-store-pos/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          ✅
│   │   │   ├── ProductController.php       ✅
│   │   │   ├── CategoryController.php      ✅
│   │   │   ├── TransactionController.php   ✅
│   │   │   ├── InventoryController.php     ✅
│   │   │   ├── ReportController.php        ✅
│   │   │   └── UserController.php          ✅
│   │   ├── Middleware/
│   │   │   ├── AuthenticateSupabase.php    ✅
│   │   │   └── CheckRole.php               ✅
│   │   └── Kernel.php                      ✅
│   └── Services/
│       └── SupabaseService.php             ✅
├── config/
│   └── services.php                        ✅
├── routes/
│   └── api.php                             ✅
├── .env.example                            ✅
├── composer.json                           ✅
└── README.md                               ✅
```

---

## 🎯 API Endpoints Summary

### Auth
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register (Admin only)
- `POST /api/v1/auth/logout` - Logout

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/{id}` - Get product detail
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/{id}` - Update product (Admin)
- `DELETE /api/v1/products/{id}` - Delete product (Admin)
- `GET /api/v1/products/low-stock` - Low stock alert

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category (Admin)

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/{id}` - Transaction detail
- `POST /api/v1/transactions` - Create transaction

### Inventory
- `POST /api/v1/inventory/adjust` - Adjust stock (Admin)
- `GET /api/v1/inventory/history` - Stock history

### Reports
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/product-performance` - Product performance
- `GET /api/v1/reports/dashboard` - Dashboard statistics

### Users
- `GET /api/v1/users` - List users (Admin)
- `POST /api/v1/users` - Create user (Admin)
- `PUT /api/v1/users/{id}` - Update user (Admin)
- `DELETE /api/v1/users/{id}` - Delete user (Super Admin)

---

## 🔐 Default Login

```
Email: admin@familystore.com
Password: password123
```

---

## 🗄️ Database (Supabase)

Database sudah tersedia di Supabase dengan struktur:

- `users` - Data pengguna (3 users default)
- `categories` - 5 kategori default
- `products` - 8 produk Rp15.000
- `transactions` - Transaksi penjualan
- `transaction_items` - Detail transaksi
- `stock_history` - Riwayat stok

**Tidak perlu migration!** Database sudah siap pakai.

---

## ✅ Fitur yang Sudah Diimplementasi

### 1. Authentication ✅
- Login dengan email & password
- Password hashing (bcrypt)
- JWT-like token
- Role-based access control

### 2. Product Management ✅
- CRUD lengkap
- Low stock notification
- Category management
- Barcode support

### 3. POS Transaction ✅
- Multi-item cart
- Discount support
- Multiple payment methods
- Auto stock update
- Transaction history

### 4. Inventory ✅
- Stock adjustment (in/out/set)
- Stock history tracking
- Auto logging on transaction

### 5. Reports ✅
- Sales report by period
- Product performance
- Dashboard statistics
- Revenue & profit calculation

### 6. User Management ✅
- CRUD users
- Role management
- Password update

---

## 🧪 Testing dengan Postman

1. Import file `POSTMAN_COLLECTION.json`
2. Set variable `base_url` = `http://localhost:8000`
3. Test endpoint Login
4. Copy token dari response
5. Set variable `auth_token` dengan token tersebut
6. Test endpoints lainnya

---

## 🚢 Deployment

### Production Checklist
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Setup HTTPS
- [ ] Configure CORS
- [ ] Enable rate limiting
- [ ] Setup monitoring

### Deploy Commands
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📖 Additional Files

Lihat dokumentasi lengkap di:
- `README.md` - Panduan lengkap
- `LARAVEL_SETUP.md` - Setup instructions
- `POSTMAN_COLLECTION.json` - API testing

---

## 🆘 Troubleshooting

**Error: Class not found**
```bash
composer dump-autoload
```

**Error: Connection refused**
```bash
# Check .env Supabase credentials
SUPABASE_URL=...
SUPABASE_KEY=...
```

**Error: Unauthenticated**
```bash
# Pastikan Bearer Token ada di header
Authorization: Bearer {your_token}
```

---

## 📞 Support

Jika ada pertanyaan, silakan hubungi tim development.

**Happy Coding! 🚀**

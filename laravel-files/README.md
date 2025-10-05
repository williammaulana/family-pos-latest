# Family Store POS - Laravel + Supabase

Sistem Point of Sale (POS) dan Inventory Management untuk Family Store menggunakan Laravel sebagai backend API dan Supabase sebagai database.

## 🚀 Fitur Utama

### 1. POS (Point of Sale)
- ✅ Pencarian dan filter produk
- ✅ Keranjang belanja multi-item
- ✅ Support diskon per item dan total
- ✅ Metode pembayaran: Tunai, QRIS, Transfer
- ✅ Kalkulasi kembalian otomatis
- ✅ Pencatatan transaksi otomatis
- ✅ Update stok otomatis
- ✅ Cetak struk (PDF)

### 2. Inventory Management
- ✅ CRUD Produk lengkap
- ✅ Kategori produk
- ✅ Harga modal & harga jual
- ✅ Satuan (pcs, dus, liter, dll)
- ✅ Update stok (masuk, keluar, adjustment)
- ✅ Riwayat pergerakan stok
- ✅ Notifikasi stok menipis

### 3. Laporan & Analitik
- ✅ Laporan penjualan per periode
- ✅ Laporan per kasir
- ✅ Product performance (revenue, profit)
- ✅ Dashboard statistics
- ✅ Low stock alerts

### 4. User Management
- ✅ Login/Logout secure
- ✅ Role-based access (super_admin, admin, kasir)
- ✅ CRUD User
- ✅ Password hashing (bcrypt)

## 📋 Prerequisites

- PHP >= 8.1
- Composer
- Supabase Account

## 🛠️ Installation

### 1. Clone atau extract project

```bash
# Jika dari git
git clone <repository-url>
cd family-store-pos

# Atau extract zip file
unzip family-store-pos.zip
cd family-store-pos
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Setup Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env`:

```env
SUPABASE_URL=https://mvrbpatykfvxigwsouvs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 4. Register Middleware

Tambahkan di `bootstrap/app.php` atau `app/Http/Kernel.php`:

```php
protected $middlewareAliases = [
    // ...
    'auth.supabase' => \App\Http\Middleware\AuthenticateSupabase::class,
    'role' => \App\Http\Middleware\CheckRole::class,
];
```

### 5. Run Server

```bash
php artisan serve
```

Server akan berjalan di `http://localhost:8000`

## 📚 API Documentation

Base URL: `http://localhost:8000/api/v1`

### Authentication

Semua API (kecuali login) memerlukan Bearer Token di header:

```
Authorization: Bearer {token}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@familystore.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@familystore.com",
    "name": "Admin Family Store",
    "role": "super_admin"
  },
  "token": "base64_encoded_token"
}
```

#### Register (Admin/Super Admin only)

```http
POST /api/v1/auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "kasir3@familystore.com",
  "name": "Kasir Tiga",
  "password": "password123",
  "role": "kasir"
}
```

### Products

#### Get All Products

```http
GET /api/v1/products
Authorization: Bearer {token}
```

#### Get Single Product

```http
GET /api/v1/products/{id}
Authorization: Bearer {token}
```

#### Create Product (Admin only)

```http
POST /api/v1/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Indomie Soto",
  "category_id": "uuid",
  "price": 15000,
  "cost_price": 13000,
  "stock": 100,
  "min_stock": 15,
  "unit": "pcs",
  "barcode": "8991102009201",
  "image_url": "https://example.com/image.jpg"
}
```

#### Update Product (Admin only)

```http
PUT /api/v1/products/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 16000,
  "stock": 150
}
```

#### Delete Product (Admin only)

```http
DELETE /api/v1/products/{id}
Authorization: Bearer {token}
```

#### Get Low Stock Products

```http
GET /api/v1/products/low-stock
Authorization: Bearer {token}
```

### Categories

#### Get All Categories

```http
GET /api/v1/categories
Authorization: Bearer {token}
```

#### Create Category (Admin only)

```http
POST /api/v1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Minuman Kaleng"
}
```

### Transactions

#### Get All Transactions

```http
GET /api/v1/transactions?limit=50
Authorization: Bearer {token}
```

#### Get Single Transaction

```http
GET /api/v1/transactions/{id}
Authorization: Bearer {token}
```

#### Create Transaction

```http
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_name": "John Doe",
  "customer_phone": "08123456789",
  "payment_method": "tunai",
  "payment_amount": 50000,
  "discount_amount": 0,
  "tax_amount": 0,
  "cashier_id": "uuid",
  "notes": "Cash payment",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 15000,
      "discount_amount": 0
    },
    {
      "product_id": "uuid",
      "quantity": 1,
      "unit_price": 15000,
      "discount_amount": 0
    }
  ]
}
```

### Inventory

#### Adjust Stock (Admin only)

```http
POST /api/v1/inventory/adjust
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": "uuid",
  "quantity": 50,
  "type": "in",
  "user_id": "uuid",
  "notes": "Restock barang"
}
```

Types: `in` (masuk), `out` (keluar), `adjustment` (set stock)

#### Get Stock History

```http
GET /api/v1/inventory/history?product_id=uuid&limit=50
Authorization: Bearer {token}
```

### Reports

#### Sales Report

```http
GET /api/v1/reports/sales?days=30
Authorization: Bearer {token}
```

#### Product Performance

```http
GET /api/v1/reports/product-performance
Authorization: Bearer {token}
```

#### Dashboard Statistics

```http
GET /api/v1/reports/dashboard
Authorization: Bearer {token}
```

### Users (Admin only)

#### Get All Users

```http
GET /api/v1/users
Authorization: Bearer {token}
```

#### Create User

```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "staff@familystore.com",
  "name": "Staff Baru",
  "password": "password123",
  "role": "kasir"
}
```

#### Update User

```http
PUT /api/v1/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Staff Updated",
  "role": "admin"
}
```

#### Delete User (Super Admin only)

```http
DELETE /api/v1/users/{id}
Authorization: Bearer {token}
```

## 🔐 Default Credentials

```
Super Admin:
Email: admin@familystore.com
Password: password123

Kasir 1:
Email: kasir1@familystore.com
Password: password123

Kasir 2:
Email: kasir2@familystore.com
Password: password123
```

## 🗄️ Database Schema

Database sudah tersedia di Supabase dengan tabel:

- **users** - Data pengguna dengan role
- **categories** - Kategori produk
- **products** - Data produk dengan harga modal & jual
- **transactions** - Transaksi penjualan
- **transaction_items** - Detail item per transaksi
- **stock_history** - Riwayat pergerakan stok

## 🔒 Security

- Password menggunakan bcrypt hashing
- JWT-like token untuk authentication
- Role-based access control
- Row Level Security (RLS) di Supabase
- Input validation dengan Laravel Validator
- CORS configuration

## 📁 Project Structure

```
family-store-pos/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── TransactionController.php
│   │   │   ├── InventoryController.php
│   │   │   ├── ReportController.php
│   │   │   └── UserController.php
│   │   └── Middleware/
│   │       ├── AuthenticateSupabase.php
│   │       └── CheckRole.php
│   └── Services/
│       └── SupabaseService.php
├── config/
│   └── services.php
├── routes/
│   └── api.php
└── .env.example
```

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Test specific endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@familystore.com","password":"password123"}'
```

## 🚢 Deployment

### Production Checklist

1. Set `APP_ENV=production` di `.env`
2. Set `APP_DEBUG=false`
3. Gunakan HTTPS
4. Setup proper CORS
5. Enable rate limiting
6. Setup monitoring & logging
7. Backup database regularly

### Deploy ke Server

```bash
# Optimize autoloader
composer install --optimize-autoloader --no-dev

# Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 📖 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [API Best Practices](https://restfulapi.net/)

## 🆘 Troubleshooting

### Error: Connection refused

Pastikan Supabase URL dan Key sudah benar di `.env`

### Error: Unauthenticated

Pastikan Bearer Token ada di header request

### Error: Insufficient permissions

User Anda tidak memiliki role yang sesuai untuk akses endpoint tersebut

## 📝 License

MIT License

## 👥 Support

Email: support@familystore.com

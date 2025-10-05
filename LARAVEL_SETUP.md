# Family Store POS - Laravel + Supabase

## Setup Instructions

### 1. Install Laravel

```bash
composer create-project laravel/laravel family-store-pos
cd family-store-pos
```

### 2. Install Dependencies

```bash
# Supabase PHP Client
composer require supabase-community/supabase-php

# Additional packages
composer require firebase/php-jwt
composer require guzzlehttp/guzzle
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
APP_NAME="Family Store POS"
APP_ENV=local
APP_KEY=base64:... # Generate with: php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# Supabase Configuration
SUPABASE_URL=https://mvrbpatykfvxigwsouvs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmJwYXR5a2Z2eGlnd3NvdXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDczNDMsImV4cCI6MjA3NTA4MzM0M30.HRIcAOPZlfQZlHk0bACHFz4vi9117piuYAtpRKDZ4Ic
SUPABASE_SERVICE_KEY=your_service_role_key

# Session & Cache
SESSION_DRIVER=file
CACHE_DRIVER=file

# Xendit (Optional)
XENDIT_SECRET_KEY=your_xendit_key
XENDIT_PUBLIC_KEY=your_xendit_public_key
```

### 4. Directory Structure

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
│   ├── Services/
│   │   ├── SupabaseService.php
│   │   ├── AuthService.php
│   │   ├── ProductService.php
│   │   ├── TransactionService.php
│   │   └── ReportService.php
│   └── Models/
│       ├── User.php
│       ├── Product.php
│       ├── Category.php
│       ├── Transaction.php
│       └── TransactionItem.php
├── routes/
│   ├── api.php
│   └── web.php
├── resources/
│   └── views/
│       └── (Vue.js/React frontend atau Blade)
└── database/
    └── migrations/
        └── supabase_schema.sql
```

### 5. Run Laravel

```bash
php artisan serve
```

The application will be available at `http://localhost:8000`

### 6. API Endpoints

All endpoints are prefixed with `/api/v1`

#### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/logout` - Logout

#### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/{id}` - Get product by ID
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product
- `GET /api/v1/products/low-stock` - Get low stock products

#### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create category

#### Transactions
- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/{id}` - Get transaction by ID
- `POST /api/v1/transactions` - Create transaction

#### Inventory
- `POST /api/v1/inventory/adjust` - Adjust stock
- `GET /api/v1/inventory/history` - Get stock history

#### Reports
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/product-performance` - Product performance
- `GET /api/v1/reports/dashboard` - Dashboard statistics

#### Users
- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### 7. Frontend Options

#### Option A: Blade Templates (Traditional)
Laravel Blade with Bootstrap/Tailwind

#### Option B: Inertia.js + Vue/React
Modern SPA with Laravel backend

#### Option C: API Only + Separate Frontend
Use Laravel as API only, separate React/Vue app

### 8. Testing

```bash
# Run tests
php artisan test

# Create test database
php artisan migrate --env=testing
```

### 9. Default Login Credentials

```
Email: admin@familystore.com
Password: password123
Role: Super Admin

Email: kasir1@familystore.com
Password: password123
Role: Kasir
```

### 10. Features Implemented

✅ Authentication with Supabase
✅ Product Management (CRUD)
✅ Category Management
✅ POS Transaction System
✅ Stock Management with History
✅ Reports & Analytics
✅ User Management with Roles
✅ Low Stock Alerts
✅ Receipt Generation (PDF)

### 11. Security Notes

- All API routes are protected with authentication middleware
- Role-based access control (super_admin, admin, kasir)
- Password hashing with bcrypt
- CORS configuration for frontend access
- Rate limiting on authentication endpoints

### 12. Database Schema

The database is already set up in Supabase with tables:
- users
- categories
- products
- transactions
- transaction_items
- stock_history

All tables have proper indexes and Row Level Security policies.

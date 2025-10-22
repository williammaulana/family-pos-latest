# Supabase Database Reset Script

This script completely resets your Supabase database with fresh migrations and seed data.

## File: `reset-supabase-database.sql`

## What it does:
1. **Drops all existing tables** (in reverse dependency order)
2. **Applies all migrations** in chronological order:
   - Basic POS tables (users, categories, products, transactions, etc.)
   - Extended features (discounts, payment methods)
   - User authentication (password hashes)
   - Multi-location support (warehouses, stores, stock management)
   - Document management (Surat Jalan, Penerimaan Barang)
3. **Seeds fresh data**:
   - 3 users (superadmin, admin, kasir)
   - 6 categories
   - 10 sample products
   - 2 warehouses and 3 stores
4. **Initializes product stocks** for all locations

## How to use:

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `reset-supabase-database.sql`
4. Click **Run** to execute

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --linked
```

### Option 3: Direct SQL execution
```bash
# If you have psql access
psql -h your-db-host -U postgres -d postgres -f scripts/reset-supabase-database.sql
```

## ⚠️ WARNING
- **This will DELETE ALL existing data!**
- Only run this in development environments
- Make sure to backup important data before running

## After reset, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@familystore.com | password123 |
| Admin | admin@familystore.com | password123 |
| Kasir | kasir1@familystore.com | password123 |

**Note:** Password hash has been updated to match "password123" for all users.

## What gets created:

### Tables:
- `users` - User accounts with roles
- `categories` - Product categories
- `products` - Product catalog
- `transactions` - Sales transactions
- `transaction_items` - Transaction line items
- `warehouses` - Warehouse locations
- `stores` - Store locations
- `product_stocks` - Stock levels per location
- `stock_movements` - Stock movement history
- `surat_jalan` - Delivery notes
- `surat_jalan_items` - Delivery note items
- `penerimaan_barang` - Goods receipts
- `penerimaan_barang_items` - Goods receipt items
- `migrations` - Migration tracking

### Functions & Triggers:
- `ensure_category_by_name()` - Auto-create categories
- `insert_product_admin()` - Admin product insertion
- `trg_penerimaan_approve_sync_stock()` - Auto-stock updates on goods receipt approval
- `trg_surat_jalan_approve_sync_stock()` - Auto-stock updates on delivery note approval

### RLS Policies:
- Login bypass for authentication
- User self-management
- Admin full access

## Troubleshooting:

### If script fails:
1. Check Supabase project permissions
2. Ensure you're running as a service role or owner
3. Try running smaller sections individually

### If login doesn't work:
1. Verify password hash in users table
2. Check RLS policies are applied
3. Ensure Supabase Auth is configured

### If features don't work:
1. Check that all functions are created
2. Verify triggers are active
3. Ensure proper permissions are granted

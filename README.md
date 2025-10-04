## Family Store POS & Inventory

A full-featured web POS and inventory system for Family Store (serba Rp15.000). Supports cashiering, stock management, discounts, multi payment methods (Tunai, QRIS, Transfer Bank, Kartu), reporting, and user roles.

### Features
- POS: product search, cart, per-item and per-transaction discounts, multi-payment methods, receipt print/PDF, automatic transaction logging
- Inventory: CRUD products, categories, stock in/out, low-stock alerts, stock history
- Reports: daily/weekly/monthly sales, product performance, low stock
- Users: roles (super_admin, admin, kasir), secure login/logout, sessions
- Optional: QRIS/eWallet integration, export to CSV/Excel/PDF, multi-outlet ready

---

### Tech Stack
- Next.js (App Router) + TypeScript
- Database: MySQL (primary, via mysql2) or Supabase Postgres (optional)
- Auth: simple email+password (MySQL) or Supabase Auth (optional)
- UI: Tailwind + shadcn/ui

---

### 1) Quick Start (Local with MySQL)

1. Prerequisites:
   - Node.js 18+
   - MySQL 8+ (local or cloud like Railway/PlanetScale)

2. Create database (local):
   - Run this in MySQL:
     ```sql
     SOURCE ./scripts/setup-local-mysql.sql;
     ```

3. Configure environment variables: copy `.env.example` to `.env.local` and fill:
   ```env
   # MySQL
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=family_store_pos

   # (Optional) Supabase client for user/products if you enable Supabase paths
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=

   # (Optional) Xendit (if using ePayments)
   XENDIT_API_KEY=
   ```

4. Install dependencies and run dev:
   ```bash
   pnpm install
   pnpm dev
   ```

5. Run DB migrations (MySQL):
   - Open `http://localhost:3000/api/migrate` (GET) to view status
   - Run `POST http://localhost:3000/api/migrate` to apply migrations (or click from `app/database-status`)

6. Login:
   - Default seeded users (password: `password`):
     - superadmin@familystore.com (super_admin)
     - admin@familystore.com (admin)
     - kasir1@familystore.com (kasir)

7. Use the app:
   - POS: `http://localhost:3000/pos`
   - Inventory: `http://localhost:3000/inventory`
   - Reports: `http://localhost:3000/reports`

---

### 2) Using Supabase (Postgres)
This project includes full Supabase schema and seed.

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
   - Optionally also set server fallbacks: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
3. Apply Supabase migrations:
   - In the Supabase SQL editor, run these files in order:
     - `supabase/migrations/20251002160742_create_pos_tables.sql`
     - `supabase/migrations/20251003120000_extend_pos_features.sql`
4. Seed sample data:
   - Run: `supabase/seed/20251003121500_seed_pos_data.sql`
5. Switch API layer (optional):
   - Many API routes already use Supabase services (e.g., `app/api/transactions/create/route.ts`). If you want to use Supabase fully, keep `lib/supabase-service.ts` in use and ensure your Supabase `users` table is synchronized with your auth users. If using MySQL primarily, keep `lib/mysql-service.ts` routes.

Notes:
- Supabase migration includes RLS policies. Ensure users are authenticated to access data.
- Prices/amounts are integers (rupiah) in Supabase schema.

---

### 3) Seed Data (MySQL)
- Basic seed is included in migrations and SQL scripts:
  - Programmatic migrations: see `lib/migration.ts` (runs on `POST /api/migrate`)
  - Additional SQL seeds:
    - `scripts/mysql_seed_data.sql` (products, users, random transactions)

Run manually if desired:
```sql
SOURCE ./scripts/mysql_migration.sql;
SOURCE ./scripts/05_add_features.sql;
SOURCE ./scripts/mysql_seed_data.sql;
```

---

### 4) Payment Methods & Discounts
- Supported: `tunai (cash)`, `qris`, `transfer_bank`, `kartu_debit`, `kartu_kredit`, `e_wallet`
- Per-item discount and transaction-level discount are handled and persisted (MySQL migrations add `discount` and `discount_amount`). Supabase migration adds both, too.

---

### 5) Printing/Exporting Receipt
- Receipt printable view and PDF via `jspdf`. Access from POS after checkout.

---

### 6) Scripts Reference
- MySQL
  - Schema: `scripts/mysql_migration.sql`
  - Seed: `scripts/mysql_seed_data.sql`
  - Features: `scripts/05_add_features.sql`
  - Local DB: `scripts/setup-local-mysql.sql`
- Supabase (Postgres)
  - Base schema: `supabase/migrations/20251002160742_create_pos_tables.sql`
  - Extended features: `supabase/migrations/20251003120000_extend_pos_features.sql`
  - Seed: `supabase/seed/20251003121500_seed_pos_data.sql`

---

### 7) Deployment Tips
- MySQL Cloud (Railway/PlanetScale): follow `scripts/setup-railway-mysql.md` or `scripts/setup-planetscale-mysql.md`. Set env vars accordingly. Ensure SSL is accepted.
- Run `POST /api/migrate` after deploy to create/upgrade tables.

---

### 8) Troubleshooting
- Table not found: visit `/api/migrate` to apply migrations.
- Access denied to MySQL: check `DB_USER/DB_PASSWORD`, and host/port.
- Supabase RLS forbids access: ensure authenticated session and correct role logic.
- Decimal vs integer prices: MySQL migrations convert to integers for consistency.

---

### 9) Development Notes
- Code paths exist for both MySQL and Supabase. You can mix: e.g., use Supabase for admin-only user management and MySQL for POS, or vice versa. Align schema if you change columns.
- Avoid changing migration SQL order unless you reset the database.


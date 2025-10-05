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
- Database: Supabase Postgres (primary)
- Auth: simple email+password via `users.password_hash` (or Supabase Auth)
- UI: Tailwind + shadcn/ui

---

### 1) Quick Start (Supabase)

1. Prerequisites:
   - Node.js 18+
   - Supabase project

2. Configure environment variables: copy `.env.example` to `.env.local` and fill Supabase keys (including `SUPABASE_SERVICE_ROLE_KEY` on server if you plan to run imports)

3. Apply Supabase migrations in the SQL editor, in order:
   - `supabase/migrations/20251002160742_create_pos_tables.sql`
   - `supabase/migrations/20251003120000_extend_pos_features.sql`
   - `supabase/migrations/20251005100000_add_user_password_hash.sql`
   - Seed: `supabase/seed/20251003121500_seed_pos_data.sql`

4. Install dependencies and run dev:
   ```bash
   pnpm install
   pnpm dev
   ```

5. Verify connection:
   - Open `http://localhost:3000/api/test-connection` to verify Supabase connectivity

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

### 2) Import existing MySQL data to Supabase
Use the included import script (server-side only):

```bash
pnpm ts-node scripts/import-mysql-to-supabase.ts
# or
pnpm import:supabase
```

Requirements:
- Set MySQL envs (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) for the source
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the target

Notes:
- Supabase migration includes RLS policies. Ensure users are authenticated to access data.
- Prices/amounts are integers (rupiah) in Supabase schema.

---

### 3) Notes
- RLS policies are enabled; use authenticated requests
- Prices/amounts are integers (rupiah)

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

### 5) Deployment Tips
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client; `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on server (no client exposure)

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


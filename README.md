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
- Database: Supabase Postgres
- Auth: email+password stored in `users.password_hash` (Supabase)
- UI: Tailwind + shadcn/ui

---

### 1) Quick Start (Supabase)

1. Prerequisites:
   - Node.js 18+
   - Supabase project (free tier is fine)

2. Create database schema in Supabase:
   - In the Supabase SQL editor, run these files in order:
     - `supabase/migrations/20251002160742_create_pos_tables.sql`
     - `supabase/migrations/20251003120000_extend_pos_features.sql`
     - `supabase/migrations/20251005100000_add_user_password_hash.sql`

3. Configure environment variables: copy `.env.example` to `.env.local` and fill:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   # Optional for server routes with elevated access
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # (Optional) Xendit (if using ePayments)
   XENDIT_API_KEY=
   ```

4. Install dependencies and run dev:
   ```bash
   pnpm install
   pnpm dev
   ```

5. Health check:
   - Visit `http://localhost:3000/api/test-connection` (Supabase health)

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

### 2) Seed Data
Run in Supabase SQL editor:
- `supabase/seed/20251003121500_seed_pos_data.sql`
- `supabase/seed/20251005100500_backfill_user_password_hash.sql` (optional)

Optionally migrate existing MySQL data into Supabase:

```bash
DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... \
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
pnpm migrate:mysql-to-supabase
```

Notes:
- Supabase migration includes RLS policies. Ensure users are authenticated to access data.
- Prices/amounts are integers (rupiah) in Supabase schema.

---

### 3) MySQL Scripts (legacy)
Legacy scripts remain under `scripts/` for reference but are no longer used at runtime.

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
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. For server routes, set `SUPABASE_SERVICE_ROLE_KEY`.

---

### 8) Troubleshooting
- Supabase RLS forbids access: ensure authenticated session and correct role logic.
- Decimal vs integer prices: Supabase schema stores integers (rupiah) already.

---

### 9) Development Notes
- Code paths now target Supabase by default and MySQL code is deprecated.
- Avoid changing migration SQL order unless you reset the database.


/*
  Extend POS schema: discounts, stock history, product metadata, and payment methods
  - Adds discount_amount to transactions
  - Adds discount to transaction_items
  - Extends payment_method to include qris and transfer_bank
  - Adds stock_history table
  - Adds optional metadata to transactions
  - Adds description to categories
  - Adds cost_price, unit, sku, description to products
*/

-- Ensure extension exists (safe to run if already created by previous migration)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transaction-level discount
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;

-- Optional metadata (for gateway payloads, etc.)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Extend allowed payment methods to include QRIS and Transfer Bank
DO $$
BEGIN
  -- Drop existing constraint if present
  BEGIN
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  -- Re-add with extended list
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_payment_method_check
    CHECK (payment_method IN ('tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet', 'qris', 'transfer_bank'));
END $$;

-- Item-level discount
ALTER TABLE transaction_items
  ADD COLUMN IF NOT EXISTS discount integer NOT NULL DEFAULT 0;

-- Category description
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS description text;

-- Product metadata fields
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS description text;

-- Stock history table
CREATE TABLE IF NOT EXISTS stock_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);

-- Enable RLS for stock_history
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_history
CREATE POLICY IF NOT EXISTS "Users can view stock history"
  ON stock_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admin can insert stock history"
  ON stock_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

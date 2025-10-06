/*
  # Create POS System Tables

  ## Overview
  Creates the complete database schema for a Point of Sale (POS) system including users, categories, products, transactions, and transaction items with proper security policies.

  ## New Tables Created
  
  ### 1. users
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `name` (text) - User full name
  - `role` (text) - User role: super_admin, admin, or kasir
  - `password_hash` (text) - Hashed password for authentication
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. categories
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. products
  - `id` (uuid, primary key) - Unique product identifier
  - `name` (text) - Product name
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `price` (integer) - Product price in smallest currency unit
  - `stock` (integer) - Current stock quantity
  - `min_stock` (integer) - Minimum stock threshold for alerts
  - `barcode` (text, nullable) - Product barcode
  - `image_url` (text, nullable) - Product image URL
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 4. transactions
  - `id` (uuid, primary key) - Unique transaction identifier
  - `transaction_code` (text, unique) - Human-readable transaction code
  - `customer_name` (text, nullable) - Customer name
  - `customer_phone` (text, nullable) - Customer phone number
  - `total_amount` (integer) - Total transaction amount
  - `tax_amount` (integer) - Tax amount
  - `payment_method` (text) - Payment method: tunai, kartu_debit, kartu_kredit, e_wallet
  - `payment_amount` (integer) - Amount paid by customer
  - `change_amount` (integer) - Change given to customer
  - `status` (text) - Transaction status: completed or cancelled
  - `cashier_id` (uuid, foreign key) - Reference to users table
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. transaction_items
  - `id` (uuid, primary key) - Unique item identifier
  - `transaction_id` (uuid, foreign key) - Reference to transactions table
  - `product_id` (uuid, foreign key) - Reference to products table
  - `quantity` (integer) - Quantity purchased
  - `unit_price` (integer) - Price per unit at time of purchase
  - `total_price` (integer) - Total price for this line item
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  
  All tables have Row Level Security (RLS) enabled with the following policies:
  
  ### users table
  - Allows anonymous read access for login authentication
  - Authenticated users can update their own records
  - Only super_admin can insert new users
  - Only super_admin can delete users
  
  ### categories table
  - Allows anonymous read access
  - Admin and super_admin can insert new categories
  - Admin and super_admin can update categories
  - Super_admin can delete categories
  
  ### products table
  - Allows anonymous read access
  - Admin and super_admin can insert new products
  - Admin and super_admin can update products
  - Super_admin can delete products
  
  ### transactions table
  - Allows anonymous read access
  - Allows anonymous insert for POS transactions
  
  ### transaction_items table
  - Allows anonymous read access
  - Allows anonymous insert for POS transactions

  ## Important Notes
  - All prices and amounts are stored as integers (in smallest currency unit, e.g., cents)
  - All timestamps use timestamptz for proper timezone handling
  - Foreign key constraints ensure data integrity
  - Indexes are created on frequently queried columns for performance
  - Default values are set where appropriate to prevent null issues
  - RLS policies allow anonymous access for login and POS operations
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'kasir')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock integer NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  barcode text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code text UNIQUE NOT NULL,
  customer_name text,
  customer_phone text,
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  tax_amount integer NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet')),
  payment_amount integer NOT NULL CHECK (payment_amount >= 0),
  change_amount integer NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  cashier_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  total_price integer NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow anonymous read for login authentication
CREATE POLICY "Allow read access for authentication"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for categories table
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admin can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for products table
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Anyone can view transactions"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for transaction_items table
CREATE POLICY "Anyone can view transaction items"
  ON transaction_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert transaction items"
  ON transaction_items FOR INSERT
  WITH CHECK (true);

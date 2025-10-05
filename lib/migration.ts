import { executeQuery } from "./mysql"

interface Migration {
  id: number
  name: string
  sql: string
  executed_at?: Date
}

const migrations: Migration[] = [
  {
    id: 1,
    name: "create_initial_tables",
    sql: `
      -- Updated to use VARCHAR(36) for UUID compatibility with InfinityFree
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin', 'kasir') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        category_id VARCHAR(36),
        price DECIMAL(12,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        barcode VARCHAR(255) UNIQUE,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      -- Create transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        transaction_code VARCHAR(20) UNIQUE NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        total_amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_method ENUM('tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet') NOT NULL,
        payment_amount DECIMAL(12,2) NOT NULL,
        change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
        cashier_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Create transaction_items table
      CREATE TABLE IF NOT EXISTS transaction_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        transaction_id VARCHAR(36),
        product_id VARCHAR(36),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Create migrations table
      CREATE TABLE IF NOT EXISTS migrations (
        id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      );

      -- Create indexes for better performance
      CREATE INDEX idx_products_category_id ON products(category_id);
      CREATE INDEX idx_products_barcode ON products(barcode);
      CREATE INDEX idx_transactions_cashier_id ON transactions(cashier_id);
      CREATE INDEX idx_transactions_created_at ON transactions(created_at);
      CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
      CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);
    `,
  },
  {
    id: 2,
    name: "insert_initial_data",
    sql: `
      -- Insert users with explicit UUIDs
      INSERT IGNORE INTO users (id, email, name, role) VALUES
      (UUID(), 'superadmin@familystore.com', 'Super Admin', 'super_admin'),
      (UUID(), 'admin@familystore.com', 'Admin Store', 'admin'),
      (UUID(), 'kasir1@familystore.com', 'Kasir Satu', 'kasir'),
      (UUID(), 'kasir2@familystore.com', 'Kasir Dua', 'kasir');

      -- Insert categories
      INSERT IGNORE INTO categories (id, name) VALUES
      (UUID(), 'Makanan'),
      (UUID(), 'Minuman'),
      (UUID(), 'Snack'),
      (UUID(), 'Peralatan Rumah Tangga'),
      (UUID(), 'Kesehatan'),
      (UUID(), 'Kecantikan');
    `,
  },
  {
    id: 3,
    name: "insert_sample_products",
    sql: `
      -- Added sample products with proper category references
      INSERT IGNORE INTO products (id, name, category_id, price, stock, min_stock, barcode) 
      SELECT 
        UUID(),
        product_name,
        cat.id,
        price,
        stock,
        min_stock,
        barcode
      FROM (
        SELECT 'Indomie Goreng' as product_name, 'Makanan' as category_name, 3500 as price, 150 as stock, 20 as min_stock, '8992388101010' as barcode
        UNION ALL SELECT 'Aqua 600ml', 'Minuman', 3000, 200, 50, '8992388201010'
        UNION ALL SELECT 'Chitato Sapi Panggang', 'Snack', 8500, 75, 15, '8992388301010'
        UNION ALL SELECT 'Sabun Mandi Lifebuoy', 'Kesehatan', 4500, 100, 25, '8992388401010'
        UNION ALL SELECT 'Shampoo Pantene', 'Kecantikan', 15000, 50, 10, '8992388501010'
        UNION ALL SELECT 'Teh Botol Sosro', 'Minuman', 4000, 120, 30, '8992388601010'
        UNION ALL SELECT 'Beras Premium 5kg', 'Makanan', 65000, 25, 5, '8992388701010'
        UNION ALL SELECT 'Deterjen Rinso', 'Peralatan Rumah Tangga', 12000, 80, 15, '8992388801010'
        UNION ALL SELECT 'Kopi Kapal Api', 'Minuman', 2500, 200, 40, '8992388901010'
        UNION ALL SELECT 'Minyak Goreng Tropical', 'Makanan', 18000, 60, 10, '8992389001010'
        UNION ALL SELECT 'Susu Ultra Milk', 'Minuman', 6500, 90, 20, '8992389101010'
        UNION ALL SELECT 'Pasta Gigi Pepsodent', 'Kesehatan', 8500, 70, 15, '8992389201010'
      ) AS products_data
      JOIN categories cat ON cat.name = products_data.category_name;
    `,
  },
  {
    id: 4,
    name: "change_price_to_integer",
    sql: `
      ALTER TABLE products MODIFY COLUMN price INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN total_amount INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN tax_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transactions MODIFY COLUMN payment_amount INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN change_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transaction_items MODIFY COLUMN unit_price INTEGER NOT NULL;
      ALTER TABLE transaction_items MODIFY COLUMN total_price INTEGER NOT NULL;
    `,
  },
  {
    id: 5,
    name: "create_stock_history_table",
    sql: `
      CREATE TABLE IF NOT EXISTS stock_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_id VARCHAR(36) NOT NULL,
        quantity_change INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `,
  },
  {
    id: 6,
    name: "add_discounts_and_extend_payment_methods",
    sql: `
      -- Add transaction-level discount and extend payment methods
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('tunai','kartu_debit','kartu_kredit','e_wallet','qris','transfer_bank') NOT NULL;

      -- Add item-level discount column
      ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    id: 7,
    name: "add_auth_and_product_metadata",
    sql: `
      -- Add secure auth and richer product fields
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;
      
      -- Seed default password hash ("password") for existing demo users if missing
      UPDATE users 
      SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
      WHERE password_hash IS NULL;

      -- Categories metadata
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS description VARCHAR(255);

      -- Product metadata
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NULL;

      -- Store gateway metadata on transactions
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata TEXT NULL;
    `,
  },
  {
    id: 8,
    name: "set_demo_users_password_to_password123",
    sql: `
      -- Update demo users to use 'password123' (Laravel-style $2y$ bcrypt hash)
      UPDATE users 
      SET password_hash = '$2y$10$2LsVYo6Mid1LkohJdUDMeeLKvS5eiU5MsP/mnouNEJSRQAbQgLcPC'
      WHERE email IN (
        'superadmin@familystore.com',
        'admin@familystore.com',
        'kasir1@familystore.com',
        'kasir2@familystore.com'
      )
      OR password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    `,
  },
]

export async function runMigrations() {
  try {
    console.log("[v0] Starting database migrations...")

    // Check if migrations table exists
    let migrationsTableExists = false
    try {
      await executeQuery("SELECT 1 FROM migrations LIMIT 1")
      migrationsTableExists = true
    } catch (error) {
      console.log("[v0] Migrations table not found, creating it now...")
      // Create migrations table explicitly
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `)
      migrationsTableExists = true
    }

    // Get executed migrations
    let executedMigrations: number[] = []
    if (migrationsTableExists) {
      const results = (await executeQuery("SELECT id FROM migrations")) as any[]
      executedMigrations = results.map((row: any) => row.id)
    }

    // Helper to emulate "ADD COLUMN IF NOT EXISTS" for MySQL variants without support
    async function addColumnIfNotExists(
      tableName: string,
      columnName: string,
      columnDefinition: string
    ) {
      const existing = (await executeQuery(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
      )) as any[]
      const count = Array.isArray(existing) && existing.length > 0 ? (existing[0].cnt ?? existing[0].COUNT ?? existing[0]["COUNT(*)"]) : 0

      if (!count) {
        console.log(
          `[v0] Adding missing column ${tableName}.${columnName} ...`
        )
        await executeQuery(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
        )
      } else {
        console.log(
          `[v0] Column already exists, skipping: ${tableName}.${columnName}`
        )
      }
    }

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.id)) {
        console.log(`[v0] Running migration: ${migration.name}`)

        // Split SQL by semicolon and execute each statement
        const statements = migration.sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        for (const statementRaw of statements) {
          const statement = statementRaw

          // Prepare a comment-stripped version for detection while preserving the original for execution
          const statementNoComments = statement
            // Remove block comments: /* ... */
            .replace(/\/\*[\s\S]*?\*\//g, "")
            // Remove single-line comments starting with -- or #
            .replace(/(^|\n)\s*--.*(?=\n|$)/g, "$1")
            .replace(/(^|\n)\s*#.*(?=\n|$)/g, "$1")
            .trim()

          // Detect and emulate: ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <column> <definition>
          const addColIfNotExistsMatch = statementNoComments.match(
            /^ALTER\s+TABLE\s+([A-Za-z0-9_`]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([A-Za-z0-9_`]+)\s+([\s\S]+)$/i
          )

          if (addColIfNotExistsMatch) {
            const tableName = addColIfNotExistsMatch[1].replace(/`/g, "")
            const columnName = addColIfNotExistsMatch[2].replace(/`/g, "")
            const columnDefinition = addColIfNotExistsMatch[3].trim()

            await addColumnIfNotExists(tableName, columnName, columnDefinition)
            continue
          }

          await executeQuery(statement)
        }

        // Record migration as executed
        await executeQuery("INSERT INTO migrations (id, name) VALUES (?, ?)", [migration.id, migration.name])

        console.log(`[v0] Migration completed: ${migration.name}`)
      }
    }

    console.log("[v0] All migrations completed successfully")
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    throw error
  }
}

export async function checkMigrationStatus() {
  try {
    const results = (await executeQuery("SELECT * FROM migrations ORDER BY id")) as any[]
    return results
  } catch (error) {
    return []
  }
}

export const initializeDatabase = runMigrations

"use strict";exports.id=808,exports.ids=[808],exports.modules={55484:(t,e,a)=>{a.d(e,{sh:()=>n,xN:()=>c,xt:()=>o});var r=a(51753);let i=[{id:1,name:"create_initial_tables",sql:`
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
    `},{id:2,name:"insert_initial_data",sql:`
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
    `},{id:3,name:"insert_sample_products",sql:`
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
    `},{id:4,name:"change_price_to_integer",sql:`
      ALTER TABLE products MODIFY COLUMN price INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN total_amount INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN tax_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transactions MODIFY COLUMN payment_amount INTEGER NOT NULL;
      ALTER TABLE transactions MODIFY COLUMN change_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transaction_items MODIFY COLUMN unit_price INTEGER NOT NULL;
      ALTER TABLE transaction_items MODIFY COLUMN total_price INTEGER NOT NULL;
    `},{id:5,name:"create_stock_history_table",sql:`
      CREATE TABLE IF NOT EXISTS stock_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_id VARCHAR(36) NOT NULL,
        quantity_change INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `},{id:6,name:"add_discounts_and_extend_payment_methods",sql:`
      -- Add transaction-level discount and extend payment methods
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('tunai','kartu_debit','kartu_kredit','e_wallet','qris','transfer_bank') NOT NULL;

      -- Add item-level discount column
      ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
    `},{id:7,name:"add_auth_and_product_metadata",sql:`
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
    `}];async function o(){try{console.log("[v0] Starting database migrations...");let e=!1;try{await (0,r.executeQuery)("SELECT 1 FROM migrations LIMIT 1"),e=!0}catch(t){console.log("[v0] Migrations table not found, creating it now..."),await (0,r.executeQuery)(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `),e=!0}let a=[];async function t(t,e,a){let i=await (0,r.executeQuery)("SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[t,e]);(Array.isArray(i)&&i.length>0?i[0].cnt??i[0].COUNT??i[0]["COUNT(*)"]:0)?console.log(`[v0] Column already exists, skipping: ${t}.${e}`):(console.log(`[v0] Adding missing column ${t}.${e} ...`),await (0,r.executeQuery)(`ALTER TABLE ${t} ADD COLUMN ${e} ${a}`))}for(let o of(e&&(a=(await (0,r.executeQuery)("SELECT id FROM migrations")).map(t=>t.id)),i))if(!a.includes(o.id)){for(let e of(console.log(`[v0] Running migration: ${o.name}`),o.sql.split(";").map(t=>t.trim()).filter(t=>t.length>0))){let a=e.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|\n)\s*--.*(?=\n|$)/g,"$1").replace(/(^|\n)\s*#.*(?=\n|$)/g,"$1").trim().match(/^ALTER\s+TABLE\s+([A-Za-z0-9_`]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([A-Za-z0-9_`]+)\s+([\s\S]+)$/i);if(a){let e=a[1].replace(/`/g,""),r=a[2].replace(/`/g,""),i=a[3].trim();await t(e,r,i);continue}await (0,r.executeQuery)(e)}await (0,r.executeQuery)("INSERT INTO migrations (id, name) VALUES (?, ?)",[o.id,o.name]),console.log(`[v0] Migration completed: ${o.name}`)}console.log("[v0] All migrations completed successfully")}catch(t){throw console.error("[v0] Migration failed:",t),t}}async function n(){try{return await (0,r.executeQuery)("SELECT * FROM migrations ORDER BY id")}catch(t){return[]}}let c=o},20808:(t,e,a)=>{a.r(e),a.d(e,{categoryService:()=>L,createCategory:()=>d,createProduct:()=>T,dashboardService:()=>l,deleteProduct:()=>_,formatCurrency:()=>I,formatDate:()=>y,formatTime:()=>O,getCategories:()=>u,getProducts:()=>E,getUserById:()=>s,getUsers:()=>c,initializeDatabase:()=>n,productService:()=>N,reportsService:()=>A,transactionService:()=>R,updateProduct:()=>m,userService:()=>p});var r=a(51753),i=a(55484),o=a(84770);async function n(){await (0,i.xt)()}async function c(){return await (0,r.executeQuery)("SELECT * FROM users ORDER BY created_at DESC")}async function s(t){return(await (0,r.executeQuery)("SELECT * FROM users WHERE id = ?",[t]))[0]||null}async function u(){return await (0,r.executeQuery)("SELECT * FROM categories ORDER BY name")}async function d(t){let e=await (0,r.executeQuery)("INSERT INTO categories (name) VALUES (?)",[t]);return(await (0,r.executeQuery)("SELECT * FROM categories WHERE id = ?",[e.insertId]))[0]}async function E(){return(await (0,r.executeQuery)(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `)).map(t=>({id:t.id,name:t.name,category_id:t.category_id,price:t.price,stock:t.stock,min_stock:t.min_stock,barcode:t.barcode,image_url:t.image_url,created_at:t.created_at,updated_at:t.updated_at,category:t.category_name?{id:t.category_id,name:t.category_name,created_at:new Date}:void 0,cost_price:t.cost_price,unit:t.unit,sku:t.sku,description:t.description}))}async function T(t){let e=await (0,r.executeQuery)(`
    INSERT INTO products (name, category_id, price, stock, min_stock, barcode, image_url, cost_price, unit, sku, description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,[t.name,t.category_id,t.price,t.stock,t.min_stock,t.barcode,t.image_url,t.cost_price??0,t.unit??null,t.sku??null,t.description??null]);return(await (0,r.executeQuery)("SELECT * FROM products WHERE id = ?",[e.insertId]))[0]}async function m(t,e){let a=Object.keys(e).map(t=>`${t} = ?`).join(", "),i=Object.values(e);return await (0,r.executeQuery)(`UPDATE products SET ${a} WHERE id = ?`,[...i,t]),(await (0,r.executeQuery)("SELECT * FROM products WHERE id = ?",[t]))[0]}async function _(t){await (0,r.executeQuery)("DELETE FROM products WHERE id = ?",[t])}let p={getUsers:async()=>await (0,r.executeQuery)("SELECT * FROM users ORDER BY created_at DESC"),async getUserById(t){if(!t)throw Error("User ID is required");return(await (0,r.executeQuery)("SELECT * FROM users WHERE id = ?",[t]))[0]||null},async createUser(t){if(!t.email||!t.name||!t.role)throw Error("Email, name, and role are required");let e=await (0,r.executeQuery)("INSERT INTO users (id, email, name, role) VALUES (UUID(), ?, ?, ?)",[t.email,t.name,t.role]);return(await (0,r.executeQuery)("SELECT * FROM users WHERE id = ?",[e.insertId]))[0]},async updateUser(t,e){if(!t)throw Error("User ID is required");let a=[],i=[];void 0!==e.email&&(a.push("email = ?"),i.push(e.email)),void 0!==e.name&&(a.push("name = ?"),i.push(e.name)),void 0!==e.role&&(a.push("role = ?"),i.push(e.role)),a.push("updated_at = NOW()");let o=`UPDATE users SET ${a.join(", ")} WHERE id = ?`;return i.push(t),await (0,r.executeQuery)(o,i),(await (0,r.executeQuery)("SELECT * FROM users WHERE id = ?",[t]))[0]},async deleteUser(t){if(!t)throw Error("User ID is required");await (0,r.executeQuery)("DELETE FROM users WHERE id = ?",[t])}},L={getCategories:async()=>await (0,r.executeQuery)("SELECT * FROM categories ORDER BY name"),async createCategory(t,e){if(!t)throw Error("Category name is required");let a=await (0,r.executeQuery)("INSERT INTO categories (id, name, description) VALUES (UUID(), ?, ?)",[t,e||null]);return(await (0,r.executeQuery)("SELECT * FROM categories WHERE id = ?",[a.insertId]))[0]}},N={getProducts:async()=>(await (0,r.executeQuery)(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `)).map(t=>({...t,category:t.category_name||"Unknown"})),async getProductById(t){if(!t)throw Error("Product ID is required");let e=(await (0,r.executeQuery)(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,[t]))[0];return e?{...e,category:e.category_name||"Unknown"}:null},async createProduct(t){if(!t.name||!t.category_id||void 0===t.price||void 0===t.stock||void 0===t.min_stock)throw Error("Name, category_id, price, stock, and min_stock are required");let e=t.category_id;if("string"==typeof t.category){let a=(await (0,r.executeQuery)("SELECT id FROM categories WHERE name = ?",[t.category]))[0];if(!a)throw Error("Category not found");e=a.id}let a=await (0,r.executeQuery)("INSERT INTO products (id, name, category_id, price, stock, min_stock, barcode, image_url) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)",[t.name,e,t.price,t.stock,t.min_stock,t.barcode||null,t.image_url||null]),i=(await (0,r.executeQuery)(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,[a.insertId]))[0];return{...i,category:i.category_name||"Unknown"}},async updateProduct(t,e){if(!t)throw Error("Product ID is required");let a=[],i=[];if(void 0!==e.name&&(a.push("name = ?"),i.push(e.name)),void 0!==e.category_id&&(a.push("category_id = ?"),i.push(e.category_id)),void 0!==e.price&&(a.push("price = ?"),i.push(e.price)),void 0!==e.stock&&(a.push("stock = ?"),i.push(e.stock)),void 0!==e.min_stock&&(a.push("min_stock = ?"),i.push(e.min_stock)),void 0!==e.barcode&&(a.push("barcode = ?"),i.push(e.barcode)),void 0!==e.image_url&&(a.push("image_url = ?"),i.push(e.image_url)),void 0!==e.category&&"string"==typeof e.category){let t=(await (0,r.executeQuery)("SELECT id FROM categories WHERE name = ?",[e.category]))[0];t&&(a.push("category_id = ?"),i.push(t.id))}a.push("updated_at = NOW()");let o=`UPDATE products SET ${a.join(", ")} WHERE id = ?`;i.push(t),await (0,r.executeQuery)(o,i);let n=(await (0,r.executeQuery)(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,[t]))[0];return{...n,category:n.category_name||"Unknown"}},async deleteProduct(t){if(!t)throw Error("Product ID is required");await (0,r.executeQuery)("DELETE FROM products WHERE id = ?",[t])},async updateStock(t,e){if(!t)throw Error("Product ID is required");if(void 0===e)throw Error("New stock value is required");return await (0,r.executeQuery)("UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?",[e,t]),(await (0,r.executeQuery)("SELECT * FROM products WHERE id = ?",[t]))[0]},getLowStockProducts:async()=>(await (0,r.executeQuery)(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock
    `)).filter(t=>t.stock<=t.min_stock).map(t=>({...t,category:t.category_name||"Unknown"})),async adjustStock(t,e,a){if(!t||void 0===e)throw Error("Product ID and quantity change are required");await (0,r.executeQuery)("UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?",[e,t]),await (0,r.executeQuery)("INSERT INTO stock_history (id, product_id, quantity_change, reason) VALUES (UUID(), ?, ?, ?)",[t,e,a])},getStockHistory:async()=>(await (0,r.executeQuery)(`
      SELECT sh.*, p.name as product_name
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      ORDER BY sh.created_at DESC
    `)).map(t=>({...t,productName:t.product_name||"Unknown"}))},R={async getTransactions(t){let e=`
      SELECT t.*, u.name as cashier_name, 
             ti.product_id, ti.quantity, ti.unit_price, ti.total_price as subtotal, p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      ORDER BY t.created_at DESC
    `;if(t){let a=Math.max(1,Math.floor(Number(t)));e+=` LIMIT ${a}`}let a=await (0,r.executeQuery)(e,[]),i=new Map;return a.forEach(t=>{i.has(t.id)||i.set(t.id,{id:t.id,transaction_code:t.transaction_code,customer_name:t.customer_name,payment_method:t.payment_method,payment_amount:t.payment_amount,change_amount:t.change_amount,total_amount:t.total_amount,tax_amount:t.tax_amount,status:t.status,cashier_id:t.cashier_id,created_at:t.created_at,cashierName:t.cashier_name||"Unknown",items:[]}),t.product_id&&i.get(t.id).items.push({productId:t.product_id,productName:t.product_name||"Unknown",quantity:t.quantity,price:t.unit_price,subtotal:t.subtotal})}),Array.from(i.values())},async getTransactionById(t){if(!t)throw Error("Transaction ID is required");let e=await (0,r.executeQuery)(`
      SELECT t.*, u.name as cashier_name, 
             ti.product_id, ti.quantity, ti.unit_price as price, ti.total_price as subtotal, p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.id = ?
    `,[t]);if(0===e.length)return null;let a={id:e[0].id,transaction_code:e[0].transaction_code,customer_name:e[0].customer_name,payment_method:e[0].payment_method,payment_amount:e[0].payment_amount,change_amount:e[0].change_amount,total_amount:e[0].total_amount,tax_amount:e[0].tax_amount,status:e[0].status,cashier_id:e[0].cashier_id,created_at:e[0].created_at,cashierName:e[0].cashier_name||"Unknown",items:[]};return e.forEach(t=>{t.product_id&&a.items.push({productId:t.product_id,productName:t.product_name||"Unknown",quantity:t.quantity,price:t.price,subtotal:t.subtotal})}),a},async createTransaction(t){if(!t.customer_name||!t.payment_method||void 0===t.payment_amount||!t.cashier_id||!t.items||0===t.items.length)throw Error("Customer name, payment method, amount paid, cashier ID, and items are required");if(!await p.getUserById(t.cashier_id))throw Error(`Invalid cashier ID: ${t.cashier_id}. Cashier must exist in the users table.`);let e=t.items.reduce((t,e)=>t+(e.total_price||0),0),a=void 0!==t.tax_amount?t.tax_amount:Math.floor(.1*e),i=e+a,n=t.discount_amount||0,c=void 0!==t.total_amount?t.total_amount:Math.max(0,i-n),s=void 0!==t.change_amount?Math.max(0,t.change_amount):Math.max(0,t.payment_amount-c);for(let e of t.items){if(!e.product_id||void 0===e.quantity||void 0===e.unit_price||void 0===e.total_price)throw Error("Product ID, quantity, price, and subtotal are required for each item");let t=await N.getProductById(e.product_id);if(!t)throw Error(`Invalid product ID: ${e.product_id}. Product must exist in the products table.`);if(t.stock<e.quantity)throw Error(`Insufficient stock for product ID: ${e.product_id}. Available stock: ${t.stock}, requested: ${e.quantity}`)}let u=await (0,r.executeQuery)("SELECT transaction_code FROM transactions ORDER BY created_at DESC LIMIT 1"),d=1;if(u.length>0){let t=u[0].transaction_code;if(t&&t.startsWith("TRX")){let e=parseInt(t.replace("TRX",""));isNaN(e)||(d=e+1)}}let E=`TRX${d.toString().padStart(3,"0")}`,T=(0,o.randomUUID)();for(let e of(await (0,r.executeQuery)("INSERT INTO transactions (id, transaction_code, customer_name, payment_method, payment_amount, change_amount, total_amount, tax_amount, discount_amount, status, cashier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)",[T,E,t.customer_name,t.payment_method,t.payment_amount,s,c,a,n,t.cashier_id]),t.items))await (0,r.executeQuery)("INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, total_price, discount) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",[T,e.product_id,e.quantity,e.unit_price,e.total_price,e.discount||0]),await (0,r.executeQuery)("UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?",[e.quantity,e.product_id]);return await this.getTransactionById(T)},async getTodayTransactions(){let t=new Date().toISOString().split("T")[0];return await (0,r.executeQuery)("SELECT * FROM transactions WHERE DATE(created_at) = ?",[t])},async updateTransactionStatus(t,e,a){if(!t||!e)throw Error("Transaction ID and status are required");let i={status:e,updated_at:new Date().toISOString()};a&&(i.metadata=JSON.stringify(a));let o=Object.keys(i).map(t=>`${t} = ?`),n=Object.values(i);return n.push(t),await (0,r.executeQuery)(`UPDATE transactions SET ${o.join(", ")} WHERE id = ?`,n),(await (0,r.executeQuery)("SELECT * FROM transactions WHERE id = ?",[t]))[0]}},l={async getDashboardStats(){let t=new Date().toISOString().split("T")[0],e=new Date(Date.now()-864e5).toISOString().split("T")[0],a=await (0,r.executeQuery)("SELECT total_amount as total, (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id) as item_count FROM transactions t WHERE DATE(created_at) = ?",[t]),i=await (0,r.executeQuery)("SELECT total_amount as total, (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id) as item_count FROM transactions t WHERE DATE(created_at) = ?",[e]),o=await (0,r.executeQuery)("SELECT stock FROM products"),n=a.reduce((t,e)=>t+(e.total||0),0),c=i.reduce((t,e)=>t+(e.total||0),0),s=a.reduce((t,e)=>t+(e.item_count||0),0),u=i.reduce((t,e)=>t+(e.item_count||0),0),d=o.reduce((t,e)=>t+(e.stock||0),0),E=a.length,T=i.length;return{totalSales:n,productsSold:s,availableStock:d,todayTransactions:E,salesGrowth:Math.round(c>0?(n-c)/c*100:0),productsGrowth:Math.round(u>0?(s-u)/u*100:0),stockGrowth:0,transactionsGrowth:Math.round(T>0?(E-T)/T*100:0)}}},A={async getSalesReports(t=30){let e=new Date(Date.now()-864e5*t).toISOString().split("T")[0];return(await (0,r.executeQuery)("SELECT DATE(created_at) as date, SUM(total_amount) as total_sales, COUNT(*) as total_transactions FROM transactions WHERE DATE(created_at) >= ? GROUP BY DATE(created_at) ORDER BY date",[e])).map(t=>({date:t.date,totalSales:t.total_sales||0,totalTransactions:t.total_transactions||0,averageTransaction:t.total_transactions>0?t.total_sales/t.total_transactions:0}))},getProductPerformance:async()=>(await (0,r.executeQuery)(`
      SELECT ti.product_id, p.name as product_name, c.name as category_name,
             SUM(ti.quantity) as total_sold, SUM(ti.total_price) as revenue
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY ti.product_id, p.name, c.name
      ORDER BY revenue DESC
    `)).map(t=>({productId:t.product_id,productName:t.product_name||"Unknown",category:t.category_name||"Unknown",totalSold:t.total_sold||0,revenue:t.revenue||0,profit:.2*(t.revenue||0)}))},I=t=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(t),y=t=>new Intl.DateTimeFormat("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(t),O=t=>new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(t)}};
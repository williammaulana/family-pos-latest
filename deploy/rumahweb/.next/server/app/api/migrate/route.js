(()=>{var e={};e.id=3409,e.ids=[3409],e.modules={34590:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=34590,e.exports=t},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{"use strict";e.exports=require("buffer")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},98216:e=>{"use strict";e.exports=require("net")},35816:e=>{"use strict";e.exports=require("process")},76162:e=>{"use strict";e.exports=require("stream")},74026:e=>{"use strict";e.exports=require("string_decoder")},95346:e=>{"use strict";e.exports=require("timers")},82452:e=>{"use strict";e.exports=require("tls")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},38782:(e,t,a)=>{"use strict";a.r(t),a.d(t,{originalPathname:()=>N,patchFetch:()=>l,requestAsyncStorage:()=>u,routeModule:()=>d,serverHooks:()=>L,staticGenerationAsyncStorage:()=>A});var r={};a.r(r),a.d(r,{GET:()=>T,POST:()=>c});var s=a(71707),i=a(93006),n=a(68467),o=a(34033),E=a(55484);async function c(){try{await (0,E.xN)();let e=await (0,E.sh)();return o.NextResponse.json({success:!0,message:"Database migrations completed successfully",migrations:e})}catch(e){return console.error("[v0] Migration API error:",e),o.NextResponse.json({success:!1,error:"Migration failed",details:e instanceof Error?e.message:"Unknown error"},{status:500})}}async function T(){try{let e=await (0,E.sh)();return o.NextResponse.json({success:!0,migrations:e})}catch(e){return o.NextResponse.json({success:!1,error:"Failed to check migration status"},{status:500})}}let d=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/migrate/route",pathname:"/api/migrate",filename:"route",bundlePath:"app/api/migrate/route"},resolvedPagePath:"/workspace/app/api/migrate/route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:u,staticGenerationAsyncStorage:A,serverHooks:L}=d,N="/api/migrate/route";function l(){return(0,n.patchFetch)({serverHooks:L,staticGenerationAsyncStorage:A})}},55484:(e,t,a)=>{"use strict";a.d(t,{sh:()=>n,xN:()=>o,xt:()=>i});var r=a(51753);let s=[{id:1,name:"create_initial_tables",sql:`
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
    `}];async function i(){try{console.log("[v0] Starting database migrations...");let t=!1;try{await (0,r.executeQuery)("SELECT 1 FROM migrations LIMIT 1"),t=!0}catch(e){console.log("[v0] Migrations table not found, creating it now..."),await (0,r.executeQuery)(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `),t=!0}let a=[];async function e(e,t,a){let s=await (0,r.executeQuery)("SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[e,t]);(Array.isArray(s)&&s.length>0?s[0].cnt??s[0].COUNT??s[0]["COUNT(*)"]:0)?console.log(`[v0] Column already exists, skipping: ${e}.${t}`):(console.log(`[v0] Adding missing column ${e}.${t} ...`),await (0,r.executeQuery)(`ALTER TABLE ${e} ADD COLUMN ${t} ${a}`))}for(let i of(t&&(a=(await (0,r.executeQuery)("SELECT id FROM migrations")).map(e=>e.id)),s))if(!a.includes(i.id)){for(let t of(console.log(`[v0] Running migration: ${i.name}`),i.sql.split(";").map(e=>e.trim()).filter(e=>e.length>0))){let a=t.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|\n)\s*--.*(?=\n|$)/g,"$1").replace(/(^|\n)\s*#.*(?=\n|$)/g,"$1").trim().match(/^ALTER\s+TABLE\s+([A-Za-z0-9_`]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([A-Za-z0-9_`]+)\s+([\s\S]+)$/i);if(a){let t=a[1].replace(/`/g,""),r=a[2].replace(/`/g,""),s=a[3].trim();await e(t,r,s);continue}await (0,r.executeQuery)(t)}await (0,r.executeQuery)("INSERT INTO migrations (id, name) VALUES (?, ?)",[i.id,i.name]),console.log(`[v0] Migration completed: ${i.name}`)}console.log("[v0] All migrations completed successfully")}catch(e){throw console.error("[v0] Migration failed:",e),e}}async function n(){try{return await (0,r.executeQuery)("SELECT * FROM migrations ORDER BY id")}catch(e){return[]}}let o=i},51753:(e,t,a)=>{"use strict";a.d(t,{M7:()=>E,executeQuery:()=>o});var r=a(16604);let s={host:process.env.DB_HOST||"localhost",user:process.env.DB_USER||"famq4413_william",password:process.env.DB_PASSWORD||"15juli2001",database:process.env.DB_NAME||"famq4413_family_store",port:Number.parseInt(process.env.DB_PORT||"3306"),ssl:!!(process.env.DB_HOST?.includes("planetscale")||process.env.DB_HOST?.includes("railway"))&&{rejectUnauthorized:!1},connectTimeout:6e4,acquireTimeout:6e4,timeout:6e4,connectionLimit:10,queueLimit:0,charset:"utf8mb4",timezone:"+07:00"},i=null;async function n(){if(!i)try{i=r.createPool(s);let e=await i.getConnection();await e.ping(),e.release(),console.log(`[POS] MySQL connected successfully to ${s.host}:${s.port}/${s.database}`)}catch(e){if(console.error("[POS] MySQL connection failed:",e),e instanceof Error){let t=e.message||String(e);if(t.includes("ECONNREFUSED"))throw Error(`Tidak dapat terhubung ke MySQL di ${s.host}:${s.port}. Pastikan server MySQL berjalan dan dapat diakses. Periksa DB_HOST/DB_PORT atau jalankan database terlebih dahulu.`);if(t.includes("ETIMEDOUT"))throw Error(`Koneksi ke MySQL timeout ke ${s.host}:${s.port}. Periksa firewall, jaringan, atau gunakan host yang benar (mis. host Docker atau cloud).`);if(t.includes("EAI_AGAIN")||t.includes("ENOTFOUND"))throw Error(`Database host tidak ditemukan atau DNS bermasalah: ${s.host}. Periksa nilai DB_HOST.`);if(t.includes("Access denied"))throw Error("Akses ditolak. Periksa username dan password database.");if(t.includes("Unknown database"))throw Error(`Database '${s.database}' tidak ditemukan. Pastikan database sudah dibuat.`)}throw e}return i}async function o(e,t=[]){let a=await n(),r=null;try{r=await a.getConnection();let[s]=await r.execute(e,t);return s}catch(a){if(console.error("[POS] Query execution failed:",a),console.error("[POS] Query:",e),console.error("[POS] Params:",t),a instanceof Error){if(a.message.includes("Table")&&a.message.includes("doesn't exist"))throw Error("Tabel tidak ditemukan. Jalankan migration terlebih dahulu: /api/migrate");if(a.message.includes("Duplicate entry"))throw Error("Data sudah ada. Tidak dapat menambahkan data yang sama.");if(a.message.includes("cannot be null"))throw Error("Field wajib tidak boleh kosong.")}throw a}finally{r&&r.release()}}async function E(){try{let e=await n(),t=await e.getConnection();return await t.ping(),t.release(),{success:!0,message:`Koneksi berhasil ke ${s.host}:${s.port}/${s.database}`,config:{host:s.host,port:s.port,database:s.database,user:s.user,ssl:!!s.ssl}}}catch(e){return{success:!1,message:e instanceof Error?e.message:"Unknown error",config:{host:s.host,port:s.port,database:s.database,user:s.user,ssl:!!s.ssl}}}}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[6325,1276,6604],()=>a(38782));module.exports=r})();
import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

function getEnv(name, required = false) {
  const value = process.env[name]
  if (required && !value) throw new Error(`Missing required env: ${name}`)
  return value
}

async function withPool(fn) {
  const host = getEnv('DB_HOST', true)
  const user = getEnv('DB_USER', true)
  const password = getEnv('DB_PASSWORD', true)
  const database = getEnv('DB_NAME', true)
  const port = Number.parseInt(getEnv('DB_PORT') || '3306')
  const ssl = host.includes('planetscale') || host.includes('railway') ? { rejectUnauthorized: false } : undefined

  const pool = mysql.createPool({ host, user, password, database, port, ssl, connectionLimit: 5 })
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

function createSupabase() {
  const url = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) throw new Error('Supabase envs missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

function chunk(array, size) {
  const out = []
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size))
  return out
}

async function migrateTable(pool, supabase, table, selectSql, mapRow, onConflict = 'id') {
  console.log(`\n==> Migrating ${table} ...`)
  const [rows] = await pool.query(selectSql)
  const data = (rows || []).map(mapRow)
  console.log(`Fetched ${data.length} rows from MySQL.${table}`)
  let total = 0
  for (const batch of chunk(data, 500)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict })
    if (error) throw new Error(`Upsert ${table} failed: ${error.message}`)
    total += batch.length
    process.stdout.write(`  Upserted ${total}/${data.length}\r`)
  }
  console.log(`\nDone ${table}: ${total} rows.`)
}

async function main() {
  const supabase = createSupabase()
  const DEFAULT_BCRYPT = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // "password"

  await withPool(async (pool) => {
    // users
    await migrateTable(
      pool,
      supabase,
      'users',
      'SELECT id, email, name, role, COALESCE(password_hash, "") as password_hash, created_at, updated_at FROM users',
      (r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        password_hash: r.password_hash || DEFAULT_BCRYPT,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }),
      'id'
    )

    // categories
    await migrateTable(
      pool,
      supabase,
      'categories',
      'SELECT id, name, created_at, NULL as description FROM categories',
      (r) => ({
        id: r.id,
        name: r.name,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        description: r.description ?? null,
      }),
      'id'
    )

    // products
    await migrateTable(
      pool,
      supabase,
      'products',
      'SELECT id, name, category_id, price, stock, min_stock, barcode, image_url, created_at, updated_at, cost_price, unit, sku, description FROM products',
      (r) => ({
        id: r.id,
        name: r.name,
        category_id: r.category_id,
        price: Math.max(0, Math.floor(Number(r.price) || 0)),
        stock: Math.max(0, Number(r.stock) || 0),
        min_stock: Math.max(0, Number(r.min_stock) || 0),
        barcode: r.barcode || null,
        image_url: r.image_url || null,
        cost_price: Math.max(0, Number(r.cost_price) || 0),
        unit: r.unit || null,
        sku: r.sku || null,
        description: r.description || null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }),
      'id'
    )

    // transactions
    await migrateTable(
      pool,
      supabase,
      'transactions',
      'SELECT id, transaction_code, customer_name, customer_phone, total_amount, tax_amount, payment_method, payment_amount, change_amount, status, cashier_id, created_at, COALESCE(discount_amount,0) as discount_amount, metadata FROM transactions',
      (r) => ({
        id: r.id,
        transaction_code: r.transaction_code,
        customer_name: r.customer_name || null,
        customer_phone: r.customer_phone || null,
        total_amount: Math.max(0, Number(r.total_amount) || 0),
        tax_amount: Math.max(0, Number(r.tax_amount) || 0),
        payment_method: r.payment_method,
        payment_amount: Math.max(0, Number(r.payment_amount) || 0),
        change_amount: Math.max(0, Number(r.change_amount) || 0),
        status: r.status,
        cashier_id: r.cashier_id,
        discount_amount: Math.max(0, Number(r.discount_amount) || 0),
        metadata: r.metadata ? (() => { try { return JSON.parse(r.metadata) } catch { return null } })() : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }),
      'id'
    )

    // transaction_items
    await migrateTable(
      pool,
      supabase,
      'transaction_items',
      'SELECT id, transaction_id, product_id, quantity, unit_price, total_price, created_at, COALESCE(discount,0) as discount FROM transaction_items',
      (r) => ({
        id: r.id,
        transaction_id: r.transaction_id,
        product_id: r.product_id,
        quantity: Math.max(0, Number(r.quantity) || 0),
        unit_price: Math.max(0, Number(r.unit_price) || 0),
        total_price: Math.max(0, Number(r.total_price) || 0),
        discount: Math.max(0, Number(r.discount) || 0),
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }),
      'id'
    )
  })

  console.log('\nAll tables migrated successfully to Supabase.')
}

main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})

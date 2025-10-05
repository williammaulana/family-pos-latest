#!/usr/bin/env ts-node

import 'dotenv/config'
import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const mysqlHost = process.env.DB_HOST || 'localhost'
  const mysqlUser = process.env.DB_USER || 'root'
  const mysqlPassword = process.env.DB_PASSWORD || ''
  const mysqlDatabase = process.env.DB_NAME || ''
  const mysqlPort = Number.parseInt(process.env.DB_PORT || '3306')

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in environment')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  console.log('[import] Connecting to MySQL ...')
  const pool = mysql.createPool({
    host: mysqlHost,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase,
    port: mysqlPort,
    connectionLimit: 5,
    charset: 'utf8mb4',
  })

  const BATCH_SIZE = 200
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  async function upsert(table: string, rows: any[]) {
    if (!rows.length) return { inserted: 0 }
    let inserted = 0
    for (const batch of chunk(rows, BATCH_SIZE)) {
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' })
      if (error) {
        console.error(`[import] Upsert failed for ${table}:`, error.message)
        throw error
      }
      inserted += batch.length
      console.log(`[import] Upserted ${batch.length} rows into ${table}`)
    }
    return { inserted }
  }

  async function selectAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query(sql, params)
    return rows as T[]
  }

  const toIso = (v: any) => (v ? new Date(v).toISOString() : null)
  const toInt = (v: any) => (v == null ? null : Math.round(Number(v)))
  const toJson = (v: any) => {
    if (v == null || v === '') return null
    if (typeof v === 'object') return v
    try {
      return JSON.parse(String(v))
    } catch {
      return null
    }
  }

  try {
    console.log('[import] Reading source data from MySQL ...')

    const categories = await selectAll<any>(
      'SELECT id, name, description, created_at FROM categories'
    )

    const users = await selectAll<any>(
      'SELECT id, email, name, role, password_hash, created_at, updated_at FROM users'
    )

    const products = await selectAll<any>(
      `SELECT id, name, category_id, price, stock, min_stock, barcode, image_url,
              cost_price, unit, sku, description, created_at, updated_at
       FROM products`
    )

    const transactions = await selectAll<any>(
      `SELECT id, transaction_code, customer_name, customer_phone, total_amount,
              tax_amount, payment_method, payment_amount, change_amount, status,
              cashier_id, discount_amount, metadata, created_at
       FROM transactions`
    )

    const transactionItems = await selectAll<any>(
      `SELECT id, transaction_id, product_id, quantity, unit_price, total_price, discount, created_at
       FROM transaction_items`
    )

    // stock_history may not exist on some MySQL setups
    let stockHistory: any[] = []
    try {
      stockHistory = await selectAll<any>(
        `SELECT id, product_id, quantity_change, reason, created_at FROM stock_history`
      )
    } catch {
      console.log('[import] No stock_history table found in MySQL; skipping.')
    }

    console.log('[import] Transforming rows to Supabase schema ...')

    const catsOut = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      created_at: toIso(c.created_at) ?? new Date().toISOString(),
    }))

    const usersOut = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      password_hash: u.password_hash ?? null,
      created_at: toIso(u.created_at) ?? new Date().toISOString(),
      updated_at: toIso(u.updated_at) ?? new Date().toISOString(),
    }))

    const prodsOut = products.map((p) => ({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      price: toInt(p.price) ?? 0,
      stock: toInt(p.stock) ?? 0,
      min_stock: toInt(p.min_stock) ?? 0,
      barcode: p.barcode ?? null,
      image_url: p.image_url ?? null,
      cost_price: toInt(p.cost_price) ?? 0,
      unit: p.unit ?? null,
      sku: p.sku ?? null,
      description: p.description ?? null,
      created_at: toIso(p.created_at) ?? new Date().toISOString(),
      updated_at: toIso(p.updated_at) ?? new Date().toISOString(),
    }))

    const txOut = transactions.map((t) => ({
      id: t.id,
      transaction_code: t.transaction_code,
      customer_name: t.customer_name ?? null,
      customer_phone: t.customer_phone ?? null,
      total_amount: toInt(t.total_amount) ?? 0,
      tax_amount: toInt(t.tax_amount) ?? 0,
      payment_method: t.payment_method,
      payment_amount: toInt(t.payment_amount) ?? 0,
      change_amount: toInt(t.change_amount) ?? 0,
      status: t.status,
      cashier_id: t.cashier_id,
      discount_amount: toInt(t.discount_amount) ?? 0,
      metadata: toJson(t.metadata),
      created_at: toIso(t.created_at) ?? new Date().toISOString(),
    }))

    const txItemsOut = transactionItems.map((i) => ({
      id: i.id,
      transaction_id: i.transaction_id,
      product_id: i.product_id,
      quantity: toInt(i.quantity) ?? 0,
      unit_price: toInt(i.unit_price) ?? 0,
      total_price: toInt(i.total_price) ?? 0,
      discount: toInt(i.discount) ?? 0,
      created_at: toIso(i.created_at) ?? new Date().toISOString(),
    }))

    const stockHistoryOut = stockHistory.map((s) => ({
      id: s.id,
      product_id: s.product_id,
      quantity_change: toInt(s.quantity_change) ?? 0,
      reason: s.reason ?? null,
      created_at: toIso(s.created_at) ?? new Date().toISOString(),
    }))

    console.log('[import] Importing into Supabase (using service role) ...')

    // Order matters: categories -> users -> products -> transactions -> items -> stock_history
    await upsert('categories', catsOut)
    await upsert('users', usersOut)
    await upsert('products', prodsOut)
    await upsert('transactions', txOut)
    await upsert('transaction_items', txItemsOut)
    if (stockHistoryOut.length) await upsert('stock_history', stockHistoryOut)

    console.log('[import] Import completed successfully.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[import] Failed:', err)
  process.exit(1)
})

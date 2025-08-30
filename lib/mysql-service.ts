import { executeQuery } from "./mysql"
import { runMigrations } from "./migration"

export interface User {
  id: string
  email: string
  name: string
  role: "super_admin" | "admin" | "kasir"
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: string
  name: string
  created_at: Date
}

export interface Product {
  id: string
  name: string
  category_id: string
  price: number
  stock: number
  min_stock: number
  barcode?: string
  image_url?: string
  created_at: Date
  updated_at: Date
  category?: Category
}

export interface Transaction {
  id: string
  transaction_code: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  tax_amount: number
  payment_amount: number
  change_amount: number
  payment_method: "tunai" | "kartu_debit" | "kartu_kredit" | "e_wallet"
  status: "completed" | "cancelled"
  cashier_id: string
  created_at: Date
  items?: TransactionItem[]
  cashier?: User
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: Date
  product?: Product
}

// Initialize database with migrations
export async function initializeDatabase() {
  await runMigrations()
}

// User operations
export async function getUsers(): Promise<User[]> {
  const results = (await executeQuery("SELECT * FROM users ORDER BY created_at DESC")) as User[]
  return results
}

export async function getUserById(id: string): Promise<User | null> {
  const results = (await executeQuery("SELECT * FROM users WHERE id = ?", [id])) as User[]
  return results[0] || null
}

// Category operations
export async function getCategories(): Promise<Category[]> {
  const results = (await executeQuery("SELECT * FROM categories ORDER BY name")) as Category[]
  return results
}

export async function createCategory(name: string): Promise<Category> {
  const result = (await executeQuery("INSERT INTO categories (name) VALUES (?)", [name])) as any
  const newCategory = (await executeQuery("SELECT * FROM categories WHERE id = ?", [result.insertId])) as Category[]
  return newCategory[0]
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  const results = (await executeQuery(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `)) as any[]

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    category_id: row.category_id,
    price: row.price,
    stock: row.stock,
    min_stock: row.min_stock,
    barcode: row.barcode,
    image_url: row.image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_name ? { id: row.category_id, name: row.category_name, created_at: new Date() } : undefined,
  }))
}

export async function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
  const result = (await executeQuery(
    `
    INSERT INTO products (name, category_id, price, stock, min_stock, barcode, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      product.name,
      product.category_id,
      product.price,
      product.stock,
      product.min_stock,
      product.barcode,
      product.image_url,
    ],
  )) as any

  const newProduct = (await executeQuery("SELECT * FROM products WHERE id = ?", [result.insertId])) as Product[]
  return newProduct[0]
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const setClause = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ")
  const values = Object.values(updates)

  await executeQuery(`UPDATE products SET ${setClause} WHERE id = ?`, [...values, id])
  const updatedProduct = (await executeQuery("SELECT * FROM products WHERE id = ?", [id])) as Product[]
  return updatedProduct[0]
}

export async function deleteProduct(id: string): Promise<void> {
  await executeQuery("DELETE FROM products WHERE id = ?", [id])
}

// Transaction operations
export async function getTransactions(): Promise<Transaction[]> {
  const results = (await executeQuery(`
    SELECT t.*, u.name as cashier_name 
    FROM transactions t 
    LEFT JOIN users u ON t.cashier_id = u.id 
    ORDER BY t.created_at DESC
  `)) as any[]

  return results.map((row) => ({
    id: row.id,
    transaction_code: row.transaction_code,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    total_amount: row.total_amount,
    tax_amount: row.tax_amount,
    payment_amount: row.payment_amount,
    change_amount: row.change_amount,
    payment_method: row.payment_method,
    status: row.status,
    cashier_id: row.cashier_id,
    created_at: row.created_at,
    cashier: row.cashier_name ? ({ id: row.cashier_id, name: row.cashier_name } as User) : undefined,
  }))
}

export async function createTransaction(transaction: {
  customer_name?: string
  customer_phone?: string
  total_amount: number
  tax_amount: number
  payment_amount: number
  change_amount: number
  payment_method: string
  cashier_id: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}): Promise<Transaction> {
  const transactionCode = `TRX-${Date.now()}`

  // Insert transaction
  const result = (await executeQuery(
    `
    INSERT INTO transactions (id, transaction_code, customer_name, customer_phone, total_amount, tax_amount, payment_amount, change_amount, payment_method, cashier_id) 
    VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      transactionCode,
      transaction.customer_name,
      transaction.customer_phone,
      transaction.total_amount,
      transaction.tax_amount,
      transaction.payment_amount,
      transaction.change_amount,
      transaction.payment_method,
      transaction.cashier_id,
    ],
  )) as any

  // Get the inserted transaction ID
  const transactionResult = (await executeQuery("SELECT id FROM transactions WHERE transaction_code = ?", [
    transactionCode,
  ])) as any[]
  const transactionId = transactionResult[0].id

  // Insert transaction items
  for (const item of transaction.items) {
    await executeQuery(
      `
      INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, total_price) 
      VALUES (UUID(), ?, ?, ?, ?, ?)
    `,
      [transactionId, item.product_id, item.quantity, item.unit_price, item.total_price],
    )

    // Update product stock
    await executeQuery("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id])
  }

  const newTransaction = (await executeQuery("SELECT * FROM transactions WHERE id = ?", [
    transactionId,
  ])) as Transaction[]
  return newTransaction[0]
}

import { executeQuery } from "./mysql"
import { runMigrations } from "./migration"
import { randomUUID } from "crypto"

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
  price: number // integer rupiah
  stock: number
  min_stock: number
  barcode?: string
  image_url?: string
  created_at: Date
  updated_at: Date
  category?: Category
  // Extended metadata
  cost_price?: number
  unit?: string
  sku?: string
  description?: string
}

export interface Transaction {
  id: string
  transaction_code: string
  customer_name?: string
  customer_phone?: string
  total_amount: number // Change to integer
  tax_amount: number // Change to integer
  payment_amount: number // Change to integer
  change_amount: number // Change to integer
  payment_method: "tunai" | "kartu_debit" | "kartu_kredit" | "e_wallet" | "qris" | "transfer_bank"
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
  unit_price: number // Change to integer
  total_price: number // Change to integer
  created_at: Date
  product?: Product
}

export interface StockHistory {
  id: string
  product_id: string
  quantity_change: number
  reason: string
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
    cost_price: row.cost_price,
    unit: row.unit,
    sku: row.sku,
    description: row.description,
  }))
}

export async function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
  const result = (await executeQuery(
    `
    INSERT INTO products (name, category_id, price, stock, min_stock, barcode, image_url, cost_price, unit, sku, description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      product.name,
      product.category_id,
      product.price,
      product.stock,
      product.min_stock,
      product.barcode,
    product.image_url,
    (product as any).cost_price ?? 0,
    (product as any).unit ?? null,
    (product as any).sku ?? null,
    (product as any).description ?? null,
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

// User Services
export const userService = {
  async getUsers() {
    const results = await executeQuery("SELECT * FROM users ORDER BY created_at DESC")
    return results as User[]
  },

  async getUserById(id: string) {
    if (!id) throw new Error("User ID is required")
    const results = await executeQuery("SELECT * FROM users WHERE id = ?", [id])
    return (results as User[])[0] || null
  },

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
    if (!userData.email || !userData.name || !userData.role) {
      throw new Error("Email, name, and role are required")
    }
    const result = await executeQuery(
      "INSERT INTO users (id, email, name, role) VALUES (UUID(), ?, ?, ?)",
      [userData.email, userData.name, userData.role]
    ) as any
    const newUser = await executeQuery("SELECT * FROM users WHERE id = ?", [result.insertId])
    return (newUser as User[])[0]
  },

  async updateUser(id: string, userData: Partial<User>) {
    if (!id) throw new Error("User ID is required")
    const setParts = []
    const values = []
    if (userData.email !== undefined) {
      setParts.push("email = ?")
      values.push(userData.email)
    }
    if (userData.name !== undefined) {
      setParts.push("name = ?")
      values.push(userData.name)
    }
    if (userData.role !== undefined) {
      setParts.push("role = ?")
      values.push(userData.role)
    }
    setParts.push("updated_at = NOW()")
    const query = `UPDATE users SET ${setParts.join(", ")} WHERE id = ?`
    values.push(id)
    await executeQuery(query, values)
    const updatedUser = await executeQuery("SELECT * FROM users WHERE id = ?", [id])
    return (updatedUser as User[])[0]
  },

  async deleteUser(id: string) {
    if (!id) throw new Error("User ID is required")
    await executeQuery("DELETE FROM users WHERE id = ?", [id])
  },
}

// Category Services
export const categoryService = {
  async getCategories() {
    const results = await executeQuery("SELECT * FROM categories ORDER BY name")
    return results as Category[]
  },

  async createCategory(name: string, description?: string) {
    if (!name) throw new Error("Category name is required")
    const result = await executeQuery(
      "INSERT INTO categories (id, name, description) VALUES (UUID(), ?, ?)",
      [name, description || null]
    ) as any
    const newCategory = await executeQuery("SELECT * FROM categories WHERE id = ?", [result.insertId])
    return (newCategory as Category[])[0]
  },
}

// Product Services
export const productService = {
  async getProducts() {
    const results = await executeQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `)
    return (results as any[]).map((product) => ({
      ...product,
      category: product.category_name || "Unknown",
    }))
  },

  async getProductById(id: string) {
    if (!id) throw new Error("Product ID is required")
    const results = await executeQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id])
    const product = (results as any[])[0]
    if (!product) return null
    return {
      ...product,
      category: product.category_name || "Unknown",
    }
  },

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    if (!productData.name || !productData.category_id || productData.price === undefined || productData.stock === undefined || productData.min_stock === undefined) {
      throw new Error("Name, category_id, price, stock, and min_stock are required")
    }
    // Get category ID by name if category is string
    let categoryId = productData.category_id
    if (typeof productData.category === 'string') {
      const categoryResults = await executeQuery("SELECT id FROM categories WHERE name = ?", [productData.category])
      const category = (categoryResults as any[])[0]
      if (!category) throw new Error("Category not found")
      categoryId = category.id
    }
    const result = await executeQuery(
      "INSERT INTO products (id, name, category_id, price, stock, min_stock, barcode, image_url) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)",
      [
        productData.name,
        categoryId,
        productData.price,
        productData.stock,
        productData.min_stock,
        productData.barcode || null,
        productData.image_url || null,
      ]
    ) as any
    const newProduct = await executeQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.insertId])
    const product = (newProduct as any[])[0]
    return {
      ...product,
      category: product.category_name || "Unknown",
    }
  },

  async updateProduct(id: string, productData: Partial<Product>) {
    if (!id) throw new Error("Product ID is required")
    const setParts = []
    const values = []
    if (productData.name !== undefined) {
      setParts.push("name = ?")
      values.push(productData.name)
    }
    if (productData.category_id !== undefined) {
      setParts.push("category_id = ?")
      values.push(productData.category_id)
    }
    if (productData.price !== undefined) {
      setParts.push("price = ?")
      values.push(productData.price)
    }
    if (productData.stock !== undefined) {
      setParts.push("stock = ?")
      values.push(productData.stock)
    }
    if (productData.min_stock !== undefined) {
      setParts.push("min_stock = ?")
      values.push(productData.min_stock)
    }
    if (productData.barcode !== undefined) {
      setParts.push("barcode = ?")
      values.push(productData.barcode)
    }
    if (productData.image_url !== undefined) {
      setParts.push("image_url = ?")
      values.push(productData.image_url)
    }
    if (productData.category !== undefined && typeof productData.category === 'string') {
      const categoryResults = await executeQuery("SELECT id FROM categories WHERE name = ?", [productData.category])
      const category = (categoryResults as any[])[0]
      if (category) {
        setParts.push("category_id = ?")
        values.push(category.id)
      }
    }
    setParts.push("updated_at = NOW()")
    const query = `UPDATE products SET ${setParts.join(", ")} WHERE id = ?`
    values.push(id)
    await executeQuery(query, values)
    const updatedProduct = await executeQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id])
    const product = (updatedProduct as any[])[0]
    return {
      ...product,
      category: product.category_name || "Unknown",
    }
  },

  async deleteProduct(id: string) {
    if (!id) throw new Error("Product ID is required")
    await executeQuery("DELETE FROM products WHERE id = ?", [id])
  },

  async updateStock(id: string, newStock: number) {
    if (!id) throw new Error("Product ID is required")
    if (newStock === undefined) throw new Error("New stock value is required")
    await executeQuery(
      "UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?",
      [newStock, id]
    )
    const updatedProduct = await executeQuery("SELECT * FROM products WHERE id = ?", [id])
    return (updatedProduct as Product[])[0]
  },

  async getLowStockProducts() {
    const results = await executeQuery(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock
    `)
    const products = results as any[]
    const lowStockProducts = products.filter((product) => product.stock <= product.min_stock)
    return lowStockProducts.map((product) => ({
      ...product,
      category: product.category_name || "Unknown",
    }))
  },

  async adjustStock(productId: string, quantityChange: number, reason: string) {
    if (!productId || quantityChange === undefined) {
      throw new Error("Product ID and quantity change are required")
    }

    // Update product stock
    await executeQuery(
      "UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?",
      [quantityChange, productId]
    )

    // Add to stock history
    await executeQuery(
      "INSERT INTO stock_history (id, product_id, quantity_change, reason) VALUES (UUID(), ?, ?, ?)",
      [productId, quantityChange, reason]
    )
  },

  async getStockHistory() {
    const results = await executeQuery(`
      SELECT sh.*, p.name as product_name
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      ORDER BY sh.created_at DESC
    `)
    return (results as any[]).map((history) => ({
      ...history,
      productName: history.product_name || "Unknown",
    }))
  },
}

// Transaction Services
export const transactionService = {
  async getTransactions(limit?: number) {
    let query = `
      SELECT t.*, u.name as cashier_name, 
             ti.product_id, ti.quantity, ti.unit_price, ti.total_price as subtotal, p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      ORDER BY t.created_at DESC
    `
    const params = []
    if (limit) {
      query += " LIMIT ?"
      params.push(limit)
    }
    const results = await executeQuery(query, params)
    const transactionsMap = new Map()
    ;(results as any[]).forEach((row) => {
      if (!transactionsMap.has(row.id)) {
        transactionsMap.set(row.id, {
          id: row.id,
          transaction_code: row.transaction_code,
          customer_name: row.customer_name,
          payment_method: row.payment_method,
          payment_amount: row.payment_amount,
          change_amount: row.change_amount,
          total_amount: row.total_amount,
          tax_amount: row.tax_amount,
          status: row.status,
          cashier_id: row.cashier_id,
          created_at: row.created_at,
          cashierName: row.cashier_name || "Unknown",
          items: [] as any[],
        })
      }
      if (row.product_id) {
        transactionsMap.get(row.id).items.push({
          productId: row.product_id,
          productName: row.product_name || "Unknown",
          quantity: row.quantity,
          price: row.unit_price, // fix: correct alias from query
          subtotal: row.subtotal,
        })
      }
    })
    return Array.from(transactionsMap.values())
  },

  async getTransactionById(id: string) {
    if (!id) throw new Error("Transaction ID is required")
    const results = await executeQuery(`
      SELECT t.*, u.name as cashier_name, 
             ti.product_id, ti.quantity, ti.unit_price as price, ti.total_price as subtotal, p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.id = ?
    `, [id])
    if ((results as any[]).length === 0) return null
    const transaction: any = {
      id: (results as any[])[0].id,
      transaction_code: (results as any[])[0].transaction_code,
      customer_name: (results as any[])[0].customer_name,
      payment_method: (results as any[])[0].payment_method,
      payment_amount: (results as any[])[0].payment_amount,
      change_amount: (results as any[])[0].change_amount,
      total_amount: (results as any[])[0].total_amount,
      tax_amount: (results as any[])[0].tax_amount,
      status: (results as any[])[0].status,
      cashier_id: (results as any[])[0].cashier_id,
      created_at: (results as any[])[0].created_at,
      cashierName: (results as any[])[0].cashier_name || "Unknown",
      items: [],
    }
    ;(results as any[]).forEach((row) => {
      if (row.product_id) {
        transaction.items.push({
          productId: row.product_id,
          productName: row.product_name || "Unknown",
          quantity: row.quantity,
          price: row.price,
          subtotal: row.subtotal,
        })
      }
    })
    return transaction
  },

  async createTransaction(transactionData: {
    customer_name: string
    payment_method: string
    payment_amount: number
    cashier_id: string
    // optional precomputed values from client
    total_amount?: number
    tax_amount?: number
    discount_amount?: number
    change_amount?: number
    items: Array<{
      product_id: string
      quantity: number
      unit_price: number
      total_price: number // should already reflect item-level discount
      discount?: number // optional item-level discount amount
    }>
  }) {
    if (!transactionData.customer_name || !transactionData.payment_method || transactionData.payment_amount === undefined || !transactionData.cashier_id || !transactionData.items || transactionData.items.length === 0) {
      throw new Error("Customer name, payment method, amount paid, cashier ID, and items are required")
    }

    // Validate that cashier_id exists in users table
    const cashier = await userService.getUserById(transactionData.cashier_id)
    if (!cashier) {
      throw new Error(`Invalid cashier ID: ${transactionData.cashier_id}. Cashier must exist in the users table.`)
    }
  // Calculate values if not provided, using integer math consistent with UI
  const subtotal = transactionData.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const tax = transactionData.tax_amount !== undefined ? transactionData.tax_amount : Math.floor(subtotal * 0.1)
  const beforeDiscountTotal = subtotal + tax
  const discountAmount = transactionData.discount_amount || 0
  const total = transactionData.total_amount !== undefined ? transactionData.total_amount : Math.max(0, beforeDiscountTotal - discountAmount)
  const change = transactionData.change_amount !== undefined ? Math.max(0, transactionData.change_amount) : Math.max(0, transactionData.payment_amount - total)

    // Validate each product_id exists and stock is sufficient
    for (const item of transactionData.items) {
      if (!item.product_id || item.quantity === undefined || item.unit_price === undefined || item.total_price === undefined) {
        throw new Error("Product ID, quantity, price, and subtotal are required for each item")
      }
      const product = await productService.getProductById(item.product_id)
      if (!product) {
        throw new Error(`Invalid product ID: ${item.product_id}. Product must exist in the products table.`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ID: ${item.product_id}. Available stock: ${product.stock}, requested: ${item.quantity}`)
      }
    }

    // Generate transaction code
    const lastTransactionResults = await executeQuery("SELECT transaction_code FROM transactions ORDER BY created_at DESC LIMIT 1")
    let nextNumber = 1
    if ((lastTransactionResults as any[]).length > 0) {
      const lastCode = (lastTransactionResults as any[])[0].transaction_code
      if (lastCode && lastCode.startsWith("TRX")) {
        const lastNumber = parseInt(lastCode.replace("TRX", ""))
        if (!isNaN(lastNumber)) nextNumber = lastNumber + 1
      }
    }
    const transactionCode = `TRX${nextNumber.toString().padStart(3, "0")}`

    // Generate transaction ID
    const transactionId = randomUUID()

    // Create transaction
    await executeQuery(
      "INSERT INTO transactions (id, transaction_code, customer_name, payment_method, payment_amount, change_amount, total_amount, tax_amount, discount_amount, status, cashier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)",
      [
        transactionId,
        transactionCode,
        transactionData.customer_name,
        transactionData.payment_method,
        transactionData.payment_amount,
        change,
        total,
        tax,
        discountAmount,
        transactionData.cashier_id,
      ]
    )

    // Create transaction items
    for (const item of transactionData.items) {
      await executeQuery(
        "INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, total_price, discount) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
        [transactionId, item.product_id, item.quantity, item.unit_price, item.total_price, item.discount || 0]
      )
      // Update product stock
      await executeQuery("UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?", [item.quantity, item.product_id])
    }

    return await this.getTransactionById(transactionId)
  },

  async getTodayTransactions() {
    const today = new Date().toISOString().split("T")[0]
    const results = await executeQuery(
      "SELECT * FROM transactions WHERE DATE(created_at) = ?",
      [today]
    )
    return results as Transaction[]
  },

  async updateTransactionStatus(transactionId: string, status: string, metadata?: Record<string, any>) {
    if (!transactionId || !status) throw new Error("Transaction ID and status are required")
    const updateData: any = { status, updated_at: new Date().toISOString() }
    if (metadata) updateData.metadata = JSON.stringify(metadata)
    const setParts = Object.keys(updateData).map(key => `${key} = ?`)
    const values = Object.values(updateData)
    values.push(transactionId)
    await executeQuery(`UPDATE transactions SET ${setParts.join(", ")} WHERE id = ?`, values)
    const updatedTransaction = await executeQuery("SELECT * FROM transactions WHERE id = ?", [transactionId])
    return (updatedTransaction as Transaction[])[0]
  },
}

// Dashboard Services
export const dashboardService = {
  async getDashboardStats() {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get today's transactions
    const todayTransactions = await executeQuery(
      "SELECT total_amount as total, (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id) as item_count FROM transactions t WHERE DATE(created_at) = ?",
      [today]
    ) as any[]

    // Get yesterday's transactions
    const yesterdayTransactions = await executeQuery(
      "SELECT total_amount as total, (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id) as item_count FROM transactions t WHERE DATE(created_at) = ?",
      [yesterday]
    ) as any[]

    // Get total stock
    const products = await executeQuery("SELECT stock FROM products") as any[]

    // Calculate stats
    const todayTotal = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0)
    const yesterdayTotal = yesterdayTransactions.reduce((sum, t) => sum + (t.total || 0), 0)

    const todayProductsSold = todayTransactions.reduce((sum, t) => sum + (t.item_count || 0), 0)
    const yesterdayProductsSold = yesterdayTransactions.reduce((sum, t) => sum + (t.item_count || 0), 0)

    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
    const todayTransactionCount = todayTransactions.length
    const yesterdayTransactionCount = yesterdayTransactions.length

    // Calculate growth percentages
    const salesGrowth = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0
    const productsGrowth = yesterdayProductsSold > 0 ? ((todayProductsSold - yesterdayProductsSold) / yesterdayProductsSold) * 100 : 0
    const transactionsGrowth = yesterdayTransactionCount > 0 ? ((todayTransactionCount - yesterdayTransactionCount) / yesterdayTransactionCount) * 100 : 0

    return {
      totalSales: todayTotal,
      productsSold: todayProductsSold,
      availableStock: totalStock,
      todayTransactions: todayTransactionCount,
      salesGrowth: Math.round(salesGrowth),
      productsGrowth: Math.round(productsGrowth),
      stockGrowth: 0, // This would need historical stock data
      transactionsGrowth: Math.round(transactionsGrowth),
    }
  },
}

// Reports Services
export const reportsService = {
  async getSalesReports(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const results = await executeQuery(
      "SELECT DATE(created_at) as date, SUM(total_amount) as total_sales, COUNT(*) as total_transactions FROM transactions WHERE DATE(created_at) >= ? GROUP BY DATE(created_at) ORDER BY date",
      [startDate]
    ) as any[]
    return results.map((row) => ({
      date: row.date,
      totalSales: row.total_sales || 0,
      totalTransactions: row.total_transactions || 0,
      averageTransaction: row.total_transactions > 0 ? row.total_sales / row.total_transactions : 0,
    }))
  },

  async getProductPerformance() {
    const results = await executeQuery(`
      SELECT ti.product_id, p.name as product_name, c.name as category_name,
             SUM(ti.quantity) as total_sold, SUM(ti.total_price) as revenue
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY ti.product_id, p.name, c.name
      ORDER BY revenue DESC
    `) as any[]
    return results.map((row) => ({
      productId: row.product_id,
      productName: row.product_name || "Unknown",
      category: row.category_name || "Unknown",
      totalSold: row.total_sold || 0,
      revenue: row.revenue || 0,
      profit: (row.revenue || 0) * 0.2, // Assume 20% profit margin
    }))
  },
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

// Helper function to format date
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// Helper function to format time
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

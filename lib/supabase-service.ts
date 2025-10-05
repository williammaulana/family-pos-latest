import { supabase } from "./supabase"
import type { Product, User, DashboardStats } from "@/types"

// User Services
export const userService = {
  async getUsers() {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async getUserById(id: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const { data, error } = await supabase.from("users").insert([userData as any]).select().single()

    if (error) throw error
    return data
  },

  async updateUser(id: string, userData: Partial<User>) {
    const { data, error } = await supabase
      .from("users")
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) throw error
  },
}

// Category Services
export const categoryService = {
  async getCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) throw error
    return data
  },

  async createCategory(name: string, description?: string) {
    const { data, error } = await supabase.from("categories").insert([{ name, description }]).select().single()

    if (error) throw error
    return data
  },
}

// Product Services
export const productService = {
  async getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name)
      `)
      .order("name")

    if (error) throw error
    return data?.map((product) => ({
      ...product,
      category: product.categories?.name || "Unknown",
    }))
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return {
      ...data,
      category: data.categories?.name || "Unknown",
    }
  },

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    // Get category ID by name
    const { data: category } = await supabase.from("categories").select("id").eq("name", productData.category).single()

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          ...productData,
          category_id: category?.id,
        },
      ])
      .select(`
        *,
        categories(name)
      `)
      .single()

    if (error) throw error
    return {
      ...data,
      category: data.categories?.name || "Unknown",
    }
  },

  async updateProduct(id: string, productData: Partial<Product>) {
    let updateData: any = { ...productData, updated_at: new Date().toISOString() }

    // Get category ID if category name is provided
    if (productData.category) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", productData.category)
        .single()

      updateData = { ...updateData, category_id: category?.id }
      delete updateData.category
    }

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        categories(name)
      `)
      .single()

    if (error) throw error
    return {
      ...data,
      category: data.categories?.name || "Unknown",
    }
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw error
  },

  async updateStock(id: string, newStock: number) {
    const { data, error } = await supabase
      .from("products")
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getLowStockProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name)
      `)
      .order("stock")

    if (error) throw error

    // Filter products where stock is less than or equal to min_stock
    const lowStockProducts = data?.filter((product) => product.stock <= product.min_stock) || []

    return lowStockProducts.map((product) => ({
      ...product,
      category: product.categories?.name || "Unknown",
    }))
  },
}

// Transaction Services
export const transactionService = {
  async getTransactions(limit?: number) {
    let query = supabase
      .from("transactions")
      .select(`
        *,
        users!transactions_cashier_id_fkey(name),
        transaction_items(
          *,
          products(name)
        )
      `)
      .order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data?.map((transaction: any) => ({
      ...transaction,
      cashierName: transaction.users?.name || "Unknown",
      items:
        transaction.transaction_items?.map((item: any) => ({
          productId: item.product_id,
          productName: item.products?.name || "Unknown",
          quantity: item.quantity,
          price: item.unit_price,
          subtotal: item.total_price,
        })) || [],
    }))
  },

  async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        users!transactions_cashier_id_fkey(name),
        transaction_items(
          *,
          products(name)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    const anyData: any = data
    return {
      ...anyData,
      cashierName: anyData.users?.name || "Unknown",
      items:
        anyData.transaction_items?.map((item: any) => ({
          productId: item.product_id,
          productName: item.products?.name || "Unknown",
          quantity: item.quantity,
          price: item.unit_price,
          subtotal: item.total_price,
        })) || [],
    }
  },

  async createTransaction(transactionData: {
    customerName: string
    paymentMethod: string
    amountPaid: number
    cashierId: string
    items: Array<{
      productId: string
      quantity: number
      price: number
      subtotal: number
    }>
  }) {
    const subtotal = transactionData.items.reduce((sum, item) => sum + Math.floor(item.subtotal || 0), 0)
    const tax = Math.floor(subtotal * 0.1)
    const total = Math.max(0, subtotal + tax)
    const change = Math.max(0, transactionData.amountPaid - total)

    // Validate each product_id exists and stock is sufficient
    for (const item of transactionData.items) {
      if (!item.productId || item.quantity === undefined || item.price === undefined || item.subtotal === undefined) {
        throw new Error("Product ID, quantity, price, and subtotal are required for each item")
      }
      const product = await productService.getProductById(item.productId)
      if (!product) {
        throw new Error(`Invalid product ID: ${item.productId}. Product must exist in the products table.`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ID: ${item.productId}. Available stock: ${product.stock}, requested: ${item.quantity}`)
      }
    }

    // Generate transaction code
    const { data: lastTransaction } = await supabase
      .from("transactions")
      .select("transaction_code")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastTransaction?.transaction_code) {
      const lastNumber = Number.parseInt(lastTransaction.transaction_code.replace("TRX", ""))
      nextNumber = lastNumber + 1
    }
    const transactionCode = `TRX${nextNumber.toString().padStart(3, "0")}`

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          transaction_code: transactionCode,
          customer_name: transactionData.customerName,
          payment_method: transactionData.paymentMethod,
          payment_amount: transactionData.amountPaid,
          change_amount: change,
          total_amount: total,
          tax_amount: tax,
          status: "completed",
          cashier_id: transactionData.cashierId,
        },
      ])
      .select()
      .single()

    if (transactionError) throw transactionError

    // Create transaction items
    const transactionItems = transactionData.items.map((item) => ({
      transaction_id: (transaction as any).id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: Math.floor(item.price || 0),
      total_price: Math.floor(item.subtotal || 0),
    }))

    const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems)

    if (itemsError) throw itemsError

    // Update product stock
    for (const item of transactionData.items) {
      const { data: product } = await supabase.from("products").select("stock").eq("id", item.productId).single()
      if (product) {
        await supabase
          .from("products")
          .update({
            stock: (product as any).stock - item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.productId)
      }
    }

    return transaction
  },

  async getTodayTransactions() {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)

    if (error) throw error
    return data
  },

  async updateTransactionStatus(transactionId: string, status: string, metadata?: Record<string, any>) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Dashboard Services
export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get today's transactions
    const { data: todayTransactions } = await supabase
      .from("transactions")
      .select("total_amount, transaction_items(quantity)")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)

    // Get yesterday's transactions for comparison
    const { data: yesterdayTransactions } = await supabase
      .from("transactions")
      .select("total_amount, transaction_items(quantity)")
      .gte("created_at", `${yesterday}T00:00:00`)
      .lt("created_at", `${yesterday}T23:59:59`)

    // Get total stock
    const { data: products } = await supabase.from("products").select("stock")

    // Calculate stats
    const todayTotal = todayTransactions?.reduce((sum, t: any) => sum + (t.total_amount || 0), 0) || 0
    const yesterdayTotal = yesterdayTransactions?.reduce((sum, t: any) => sum + (t.total_amount || 0), 0) || 0

    const todayProductsSold =
      todayTransactions?.reduce(
        (sum, t: any) => sum + ((t.transaction_items as any[])?.reduce((itemSum, item: any) => itemSum + (item.quantity || 0), 0) || 0),
        0,
      ) || 0
    const yesterdayProductsSold =
      yesterdayTransactions?.reduce(
        (sum, t: any) => sum + ((t.transaction_items as any[])?.reduce((itemSum, item: any) => itemSum + (item.quantity || 0), 0) || 0),
        0,
      ) || 0

    const totalStock = products?.reduce((sum, p: any) => sum + (p.stock || 0), 0) || 0
    const todayTransactionCount = todayTransactions?.length || 0
    const yesterdayTransactionCount = yesterdayTransactions?.length || 0

    // Calculate growth percentages
    const salesGrowth = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0
    const productsGrowth =
      yesterdayProductsSold > 0 ? ((todayProductsSold - yesterdayProductsSold) / yesterdayProductsSold) * 100 : 0
    const transactionsGrowth =
      yesterdayTransactionCount > 0
        ? ((todayTransactionCount - yesterdayTransactionCount) / yesterdayTransactionCount) * 100
        : 0

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

    const { data, error } = await supabase
      .from("transactions")
      .select("created_at, total_amount")
      .gte("created_at", `${startDate}T00:00:00`)
      .order("created_at")

    if (error) throw error

    // Group by date
    const salesByDate = data?.reduce(
      (acc, transaction) => {
        const date = (transaction as any).created_at.split("T")[0]
        if (!acc[date]) {
          acc[date] = { totalSales: 0, totalTransactions: 0 }
        }
        acc[date].totalSales += (transaction as any).total_amount || 0
        acc[date].totalTransactions += 1
        return acc
      },
      {} as Record<string, { totalSales: number; totalTransactions: number }>,
    )

    return Object.entries(salesByDate || {}).map(([date, stats]) => ({
      date,
      totalSales: stats.totalSales,
      totalTransactions: stats.totalTransactions,
      averageTransaction: stats.totalSales / stats.totalTransactions,
    }))
  },

  async getProductPerformance() {
    const { data, error } = await supabase
      .from("transaction_items")
      .select(`
        product_id,
        quantity,
        unit_price,
        total_price,
        products(name, categories(name))
      `)
      .order("total_price", { ascending: false })

    if (error) throw error

    // Group by product
    const productStats = data?.reduce(
      (acc, item) => {
        const anyItem: any = item
        const productId = anyItem.product_id
        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: anyItem.products?.name || "Unknown",
            category: anyItem.products?.categories?.name || "Unknown",
            totalSold: 0,
            revenue: 0,
            profit: 0, // This would need cost data
          }
        }
        acc[productId].totalSold += anyItem.quantity
        acc[productId].revenue += anyItem.total_price
        acc[productId].profit += anyItem.total_price * 0.2 // Assume 20% profit margin
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(productStats || {})
  },
}

export const formatCurrency = (amount: number): string => {
  // amount is integer representing smallest currency unit (e.g., cents)
  // Convert to integer rupiah amount (no decimals)
  const intAmount = Math.floor(amount)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(intAmount).replace("Rp.", "Rp")
}

// Helper function to format date (keeping from mock-data)
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// Helper function to format time (keeping from mock-data)
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const updateTransactionStatus = transactionService.updateTransactionStatus

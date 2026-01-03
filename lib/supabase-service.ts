import { supabase } from "./supabase"
import type { Product, User, DashboardStats } from "@/types"

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// User Services
export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        warehouses:warehouse_id(name),
        stores:store_id(name)
      `)
      .order("name")

    if (error) throw error

    return data?.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouse_id,
      storeId: user.store_id,
      locationName: user.warehouses?.name || user.stores?.name || null,
      passwordHash: user.password_hash,
    })) || []
  },

  async getUserById(id: string) {
    const result = await apiCall(`/api/users/${id}`)
    return result.data
  },

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const result = await apiCall('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return result.data
  },

  async updateUser(id: string, userData: Partial<User>) {
    const result = await apiCall('/api/users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    })
    return result.data
  },

  async deleteUser(id: string) {
    await apiCall('/api/users', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
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

  async updateCategory(id: string, name: string, description?: string) {
    const { data, error } = await supabase
      .from("categories")
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) throw error
  },
}

// Product Services
export const productService = {
  async getProducts(warehouseId?: string, storeId?: string) {
    let query = supabase
      .from("products")
      .select(`
        *,
        categories(name)
      `)

    // If location filters are provided, join with product_stocks
    if (warehouseId || storeId) {
      query = query
        .select(`
          *,
          categories(name),
          product_stocks!inner(stock, warehouse_id, store_id)
        `)

      // Only apply filters for defined location IDs
      if (warehouseId) {
        query = query.eq('product_stocks.warehouse_id', warehouseId)
      }
      if (storeId) {
        query = query.eq('product_stocks.store_id', storeId)
      }
    }

    const { data, error } = await query.order("name")

    if (error) throw error
    return data?.map((product: any) => ({
      ...product,
      category: product.categories?.name || "Unknown",
      // Use location-specific stock if filtering by location
      stock: warehouseId || storeId ? product.product_stocks?.[0]?.stock || 0 : product.stock,
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

  async createProductWithLocation(productData: Omit<Product, "id" | "createdAt" | "updatedAt">, locationType: string, locationId: string) {
    // First create the product
    const product = await this.createProduct(productData)

    // Then create stock entry for the location
    const { error: stockError } = await supabase
      .from("product_stocks")
      .insert([{
        product_id: product.id,
        [locationType === "warehouse" ? "warehouse_id" : "store_id"]: locationId,
        stock: productData.stock || 0,
      }])

    if (stockError) throw stockError

    return product
  },

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    // Normalisasi nama kategori
    const catName = (productData.category || "").toString().trim()

    let categoryId: string | undefined
    let rpcEnsureMissing = false
    if (catName) {
      // coba ambil kategori bila ada
      const { data: existingCat } = await supabase.from("categories").select("id").eq("name", catName).maybeSingle()

      if (existingCat?.id) {
        categoryId = existingCat.id
      } else {
        // jika belum ada, buat kategori via RPC SECURITY DEFINER untuk bypass RLS
        const { data: newCatId, error: ensureErr } = await supabase.rpc("ensure_category_by_name", { p_name: catName })
        if (ensureErr) {
          // Fallback if RPC function is missing in DB (PGRST202)
          if ((ensureErr as any).code === "PGRST202") {
            rpcEnsureMissing = true
            const { data: insertedCat, error: insertCatErr } = await supabase
              .from("categories")
              .insert([{ name: catName }])
              .select("id")
              .single()

            if (insertCatErr) {
              // Likely RLS issue if service role key is not configured
              throw new Error(
                `Failed to create category without RPC. Ensure migrations are applied and SUPABASE_SERVICE_ROLE_KEY is set on the server. Underlying error: ${insertCatErr.message || insertCatErr}`,
              )
            }
            categoryId = insertedCat.id
          } else {
            throw ensureErr
          }
        } else {
          if (!newCatId) throw new Error("Failed to create or fetch category id")
          categoryId = newCatId as string
        }
      }
    }

    // Insert product via SECURITY DEFINER RPC to bypass RLS
    const rpcPayload: any = {
      p_name: productData.name,
      p_category_name: catName,
      p_price: Math.floor((productData as any).price || 0),
      p_stock: Math.floor((productData as any).stock || 0),
      p_min_stock: Math.floor((productData as any).min_stock ?? (productData as any).minStock ?? 5),
      p_sku: (productData as any).sku ?? null,
      p_barcode: (productData as any).barcode ?? (productData as any).sku ?? null,
      p_image_url: (productData as any).image_url ?? (productData as any).imageUrl ?? null,
      p_cost_price: Math.floor((productData as any).cost_price ?? (productData as any).costPrice ?? 0),
      p_unit: (productData as any).unit ?? null,
      p_description: (productData as any).description ?? null,
    }
    let newProductId: string | undefined
    // If the ensure RPC was missing, the product RPC likely is too. Try direct insert fallback.
    if (rpcEnsureMissing) {
      const { data: insertedProduct, error: insertProductErr } = await supabase
        .from("products")
        .insert([
          {
            name: productData.name,
            category_id: categoryId,
            price: Math.floor((productData as any).price || 0),
            stock: Math.floor((productData as any).stock || 0),
            min_stock: Math.floor((productData as any).min_stock ?? (productData as any).minStock ?? 5),
            sku: (productData as any).sku ?? null,
            barcode: (productData as any).barcode ?? (productData as any).sku ?? null,
            image_url: (productData as any).image_url ?? (productData as any).imageUrl ?? null,
            cost_price: Math.floor((productData as any).cost_price ?? (productData as any).costPrice ?? 0),
            unit: (productData as any).unit ?? null,
            description: (productData as any).description ?? null,
          },
        ])
        .select("id")
        .single()

      if (insertProductErr) {
        throw new Error(
          `Failed to insert product without RPC. Ensure migrations are applied and SUPABASE_SERVICE_ROLE_KEY is set on the server. Underlying error: ${insertProductErr.message || insertProductErr}`,
        )
      }
      newProductId = (insertedProduct as any).id
    } else {
      const { data: rpcInsertedId, error: rpcError } = await supabase.rpc("insert_product_admin", rpcPayload)
      if (rpcError) {
        // Fallback if product RPC is missing in DB
        if ((rpcError as any).code === "PGRST202") {
          const { data: insertedProduct, error: insertProductErr } = await supabase
            .from("products")
            .insert([
              {
                name: productData.name,
                category_id: categoryId,
                price: Math.floor((productData as any).price || 0),
                stock: Math.floor((productData as any).stock || 0),
                min_stock: Math.floor((productData as any).min_stock ?? (productData as any).minStock ?? 5),
                sku: (productData as any).sku ?? null,
                barcode: (productData as any).barcode ?? (productData as any).sku ?? null,
                image_url: (productData as any).image_url ?? (productData as any).imageUrl ?? null,
                cost_price: Math.floor((productData as any).cost_price ?? (productData as any).costPrice ?? 0),
                unit: (productData as any).unit ?? null,
                description: (productData as any).description ?? null,
              },
            ])
            .select("id")
            .single()

          if (insertProductErr) {
            throw new Error(
              `Failed to insert product without RPC. Ensure migrations are applied and SUPABASE_SERVICE_ROLE_KEY is set on the server. Underlying error: ${insertProductErr.message || insertProductErr}`,
            )
          }
          newProductId = (insertedProduct as any).id
        } else {
          throw rpcError
        }
      } else {
        newProductId = rpcInsertedId as any
      }
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name)
      `)
      .eq("id", newProductId as any)
      .single()

    if (error) throw error
    return {
      ...data,
      category: (data as any).categories?.name || "Unknown",
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

  async updateProductLocation(productId: string, locationType: string, locationId: string) {
    // First, get current product stock
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single()

    if (productError) throw productError

    const typedProduct = product as { stock: number }

    // Remove existing stock entries for this product
    const { error: deleteError } = await supabase
      .from("product_stocks")
      .delete()
      .eq("product_id", productId)

    if (deleteError) throw deleteError

    // Create new stock entry for the new location
    const { error: insertError } = await supabase
      .from("product_stocks")
      .insert([{
        product_id: productId,
        [locationType === "warehouse" ? "warehouse_id" : "store_id"]: locationId,
        stock: typedProduct.stock || 0,
        // min_stock: 5, // Default min stock
      }])

    if (insertError) throw insertError

    return { success: true }
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
    const lowStockProducts = data?.filter((product: any) => product.stock <= product.min_stock) || []

    return lowStockProducts.map((product: any) => ({
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
    const tax = 0 // Tax calculation removed
    const total = Math.max(0, subtotal)
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
        throw new Error(
          `Insufficient stock for product ID: ${item.productId}. Available stock: ${product.stock}, requested: ${item.quantity}`,
        )
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
      const { data: product } = await supabase.from("product_stocks").select("stock").eq("product_id", item.productId).single()
      if (product) {
        await supabase
          .from("product_stocks")
          .update({
            stock: (product as any).stock - item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", item.productId)
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
    const { data: products } = await supabase.from("products_stocks").select("stock")

    // Calculate stats
    const todayTotal = todayTransactions?.reduce((sum: any, t: any) => sum + (t.total_amount || 0), 0) || 0
    const yesterdayTotal = yesterdayTransactions?.reduce((sum: any, t: any) => sum + (t.total_amount || 0), 0) || 0

    const todayProductsSold =
      todayTransactions?.reduce(
        (sum: any, t: any) =>
          sum +
          ((t.transaction_items as any[])?.reduce((itemSum, item: any) => itemSum + (item.quantity || 0), 0) || 0),
        0,
      ) || 0
    const yesterdayProductsSold =
      yesterdayTransactions?.reduce(
        (sum: any, t: any) =>
          sum +
          ((t.transaction_items as any[])?.reduce((itemSum, item: any) => itemSum + (item.quantity || 0), 0) || 0),
        0,
      ) || 0

    console.log('====================================');
    console.log('products', products);
    console.log('====================================');

    const totalStock = products?.reduce((sum: any, p: any) => sum + (p.stock || 0), 0) || 0
    const todayTransactionCount = todayTransactions?.length || 0
    const yesterdayTransactionCount = yesterdayTransactions?.length || 0

    console.log('====================================');
    console.log('totalStock', totalStock);
    console.log('====================================');

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
      (acc: any, transaction: any) => {
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
      totalSales: (stats as any).totalSales,
      totalTransactions: (stats as any).totalTransactions,
      averageTransaction: (stats as any).totalSales / (stats as any).totalTransactions,
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
      (acc: any, item: any) => {
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
  })
    .format(intAmount)
    .replace("Rp.", "Rp")
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

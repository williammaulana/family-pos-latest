export interface User {
  id: string
  name: string
  email: string
  role:
    | "superadmin"
    | "admin_gudang"
    | "admin_toko"
    | "staff"
    // kompatibilitas lama
    | "super_admin"
    | "admin"
    | "kasir"
  avatar?: string
  warehouseId?: string
  storeId?: string
  locationName?: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  category: string
  price: number
  costPrice?: number
  stock: number
  minStock: number
  barcode?: string
  unit?: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  code: string
  customerName?: string
  items: TransactionItem[]
  total: number
  status: "completed" | "pending" | "cancelled"
  cashierId: string
  createdAt: Date
}

export interface TransactionItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
  discount?: number
  discountType?: "percentage" | "fixed"
}

export interface DashboardStats {
  totalSales: number
  productsSold: number
  availableStock: number
  todayTransactions: number
  salesGrowth: number
  productsGrowth: number
  stockGrowth: number
  transactionsGrowth: number
}

export interface Discount {
  type: "percentage" | "fixed"
  value: number
  description?: string
}

export interface TransactionDiscount {
  type: "percentage" | "fixed"
  value: number
  description?: string
}

export interface StockHistory {
  id: string
  productId: string
  productName: string
  quantityChange: number
  reason: string
  type: "in" | "out" | "adjustment"
  createdAt: Date
}

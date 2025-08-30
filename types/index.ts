export interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "kasir"
  avatar?: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  barcode?: string
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

import type { Product, Transaction, DashboardStats } from "@/types"

// Mock products data
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Indomie Goreng",
    category: "Makanan",
    price: 3500,
    stock: 5,
    minStock: 20,
    barcode: "8992388101010",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "2",
    name: "Aqua 600ml",
    category: "Minuman",
    price: 4000,
    stock: 12,
    minStock: 50,
    barcode: "8992771010101",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "3",
    name: "Sabun Mandi",
    category: "Kebersihan",
    price: 8500,
    stock: 3,
    minStock: 15,
    barcode: "8992388202020",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "4",
    name: "Beras 5kg",
    category: "Makanan",
    price: 65000,
    stock: 25,
    minStock: 10,
    barcode: "8992388303030",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "5",
    name: "Minyak Goreng 1L",
    category: "Makanan",
    price: 18000,
    stock: 8,
    minStock: 15,
    barcode: "8992388404040",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
]

// Mock transactions data
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    code: "TRX001",
    customerName: "Walk-in Customer",
    items: [
      {
        productId: "1",
        productName: "Indomie Goreng",
        quantity: 5,
        price: 3500,
        subtotal: 17500,
      },
      {
        productId: "4",
        productName: "Beras 5kg",
        quantity: 1,
        price: 65000,
        subtotal: 65000,
      },
    ],
    total: 75000,
    status: "completed",
    cashierId: "3",
    createdAt: new Date("2025-01-15T14:30:00"),
  },
  {
    id: "2",
    code: "TRX002",
    customerName: "Ibu Siti",
    items: [
      {
        productId: "2",
        productName: "Aqua 600ml",
        quantity: 8,
        price: 4000,
        subtotal: 32000,
      },
      {
        productId: "5",
        productName: "Minyak Goreng 1L",
        quantity: 2,
        price: 18000,
        subtotal: 36000,
      },
      {
        productId: "3",
        productName: "Sabun Mandi",
        quantity: 3,
        price: 8500,
        subtotal: 25500,
      },
    ],
    total: 125000,
    status: "completed",
    cashierId: "3",
    createdAt: new Date("2025-01-15T14:15:00"),
  },
]

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  totalSales: 2450000,
  productsSold: 245,
  availableStock: 1234,
  todayTransactions: 87,
  salesGrowth: 12,
  productsGrowth: 8,
  stockGrowth: -5,
  transactionsGrowth: 15,
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

export interface SalesReport {
  date: string
  totalSales: number
  totalTransactions: number
  averageTransaction: number
}

export interface ProductPerformance {
  productId: string
  productName: string
  category: string
  totalSold: number
  revenue: number
  profit: number
}

// Mock sales data for the last 30 days
export const mockSalesReports: SalesReport[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - i)

  return {
    date: date.toISOString().split("T")[0],
    totalSales: Math.floor(Math.random() * 5000000) + 1000000,
    totalTransactions: Math.floor(Math.random() * 200) + 50,
    averageTransaction: Math.floor(Math.random() * 100000) + 20000,
  }
}).reverse()

// Mock product performance data
export const mockProductPerformance: ProductPerformance[] = [
  {
    productId: "1",
    productName: "Indomie Goreng",
    category: "Makanan",
    totalSold: 450,
    revenue: 1575000,
    profit: 450000,
  },
  {
    productId: "2",
    productName: "Aqua 600ml",
    category: "Minuman",
    totalSold: 320,
    revenue: 1280000,
    profit: 320000,
  },
  {
    productId: "4",
    productName: "Beras 5kg",
    category: "Makanan",
    totalSold: 85,
    revenue: 5525000,
    profit: 850000,
  },
  {
    productId: "5",
    productName: "Minyak Goreng 1L",
    category: "Makanan",
    totalSold: 120,
    revenue: 2160000,
    profit: 360000,
  },
  {
    productId: "3",
    productName: "Sabun Mandi",
    category: "Kebersihan",
    totalSold: 95,
    revenue: 807500,
    profit: 190000,
  },
]

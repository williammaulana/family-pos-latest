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

export interface StockReport {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  status: "normal" | "low" | "out"
  lastRestocked: Date
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

// Mock stock reports
export const mockStockReports: StockReport[] = [
  {
    productId: "1",
    productName: "Indomie Goreng",
    category: "Makanan",
    currentStock: 5,
    minStock: 20,
    status: "low",
    lastRestocked: new Date("2025-01-10"),
  },
  {
    productId: "2",
    productName: "Aqua 600ml",
    category: "Minuman",
    currentStock: 12,
    minStock: 50,
    status: "low",
    lastRestocked: new Date("2025-01-12"),
  },
  {
    productId: "3",
    productName: "Sabun Mandi",
    category: "Kebersihan",
    currentStock: 3,
    minStock: 15,
    status: "low",
    lastRestocked: new Date("2025-01-08"),
  },
  {
    productId: "4",
    productName: "Beras 5kg",
    category: "Makanan",
    currentStock: 25,
    minStock: 10,
    status: "normal",
    lastRestocked: new Date("2025-01-14"),
  },
  {
    productId: "5",
    productName: "Minyak Goreng 1L",
    category: "Makanan",
    currentStock: 8,
    minStock: 15,
    status: "low",
    lastRestocked: new Date("2025-01-11"),
  },
]

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SalesChart } from "@/components/reports/sales-chart"
import { ProductPerformanceTable } from "@/components/reports/product-performance-table"
import { StockStatusTable } from "@/components/reports/stock-status-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, Package, ShoppingCart, AlertTriangle, Download } from "lucide-react"
import { reportsService, productService, formatCurrency } from "@/lib/supabase-service"
import { exportToCSV, exportToExcel, exportToJSON, type ExportData } from "@/lib/export-utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reportStats, setReportStats] = useState({
    totalSales7Days: 0,
    totalTransactions7Days: 0,
    totalRevenue: 0,
    topProduct: { name: "", totalSold: 0 },
    lowStockCount: 0,
  })
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
    if (!isLoading && user && user.role === "kasir") {
      router.push("/dashboard")
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses ke halaman reports",
        variant: "destructive",
      })
    }
  }, [user, isLoading, router, toast])

  useEffect(() => {
    const fetchReportStats = async () => {
      try {
        const [salesData, productPerformance, lowStockProducts] = await Promise.all([
          reportsService.getSalesReports(7),
          reportsService.getProductPerformance(),
          productService.getLowStockProducts(),
        ])

        const totalSales7Days = salesData.reduce((sum: number, day: any) => sum + day.totalSales, 0)
        const totalTransactions7Days = salesData.reduce((sum: number, day: any) => sum + day.totalTransactions, 0)
        const totalRevenue = productPerformance.reduce((sum: number, product: any) => sum + product.revenue, 0)
        const sortedProducts = [...productPerformance].sort((a: any, b: any) => b.revenue - a.revenue)
        const topProduct = sortedProducts[0] || { productName: "Tidak ada", totalSold: 0 }

        setReportStats({
          totalSales7Days,
          totalTransactions7Days,
          totalRevenue,
          topProduct: { name: topProduct.productName, totalSold: topProduct.totalSold },
          lowStockCount: lowStockProducts.length,
        })
      } catch (error) {
        console.error("Error fetching report stats:", error)
      } finally {
        setIsStatsLoading(false)
      }
    }

    if (user && user.role !== "kasir") {
      fetchReportStats()
    }
  }, [user])

  const handleExportReports = async (format: "csv" | "excel" | "json") => {
    try {
      const [salesData, productPerformance, lowStockProducts] = await Promise.all([
        reportsService.getSalesReports(30), // Get 30 days of data
        reportsService.getProductPerformance(),
        productService.getLowStockProducts(),
      ])

      if (format === "json") {
        const reportData = {
          salesData,
          productPerformance,
          lowStockProducts,
          generatedAt: new Date().toISOString(),
        }
        exportToJSON(reportData, `reports-${new Date().toISOString().split("T")[0]}`)
      } else {
        // Combine all data into a single export
        const exportData: ExportData = {
          headers: ["Type", "Name", "Value", "Date"],
          rows: [
            ...salesData.map((item: any) => ["Sales", item.date, item.totalSales, item.date]),
            ...productPerformance.map((item: any) => [
              "Product Performance",
              item.productName,
              item.revenue,
              new Date().toISOString().split("T")[0],
            ]),
            ...lowStockProducts.map((item: any) => [
              "Low Stock Alert",
              item.name,
              item.stock,
              new Date().toISOString().split("T")[0],
            ]),
          ],
          filename: `reports-${new Date().toISOString().split("T")[0]}`,
        }

        if (format === "csv") {
          exportToCSV(exportData)
        } else {
          exportToExcel(exportData)
        }
      }

      toast({
        title: "Export Berhasil",
        description: `Laporan berhasil diekspor dalam format ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor laporan",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role === "kasir") {
    return null
  }

  return (
    <DashboardLayout title="Laporan & Analisis">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Laporan & Analisis</h1>
            <p className="text-sm text-muted-foreground">Analisis performa bisnis dan laporan penjualan</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export Laporan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportReports("excel")}>Export Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReports("csv")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReports("json")}>Export JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan 7 Hari</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(reportStats.totalSales7Days)}</div>
                  <p className="text-xs text-muted-foreground">{reportStats.totalTransactions7Days} transaksi</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(reportStats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Semua waktu</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{reportStats.topProduct.name}</div>
                  <p className="text-xs text-muted-foreground">{reportStats.topProduct.totalSold} terjual</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Stok</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">{reportStats.lowStockCount}</div>
                  <p className="text-xs text-muted-foreground">Produk perlu restock</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <SalesChart />

        {/* Product Performance and Stock Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductPerformanceTable />
          <StockStatusTable />
        </div>
      </div>
    </DashboardLayout>
  )
}

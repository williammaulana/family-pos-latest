"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { LowStockAlert } from "@/components/dashboard/low-stock-alert"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import type { DashboardStats } from "@/types"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        setDashboardStats(json.data)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setIsStatsLoading(false)
      }
    }

    if (user) {
      fetchDashboardStats()
    }
  }, [user])

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

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isStatsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))
          ) : dashboardStats ? (
            <>
              <StatsCard
                title="Total Penjualan Hari Ini"
                value={formatCurrency(dashboardStats.totalSales)}
                growth={dashboardStats.salesGrowth}
                icon={<DollarSign className="h-6 w-6 text-white" />}
                iconBgColor="bg-green-500"
              />
              <StatsCard
                title="Produk Terjual"
                value={dashboardStats.productsSold.toLocaleString("id-ID")}
                growth={dashboardStats.productsGrowth}
                icon={<ShoppingCart className="h-6 w-6 text-white" />}
                iconBgColor="bg-blue-500"
              />
              <StatsCard
                title="Stok Tersedia"
                value={dashboardStats.availableStock.toLocaleString("id-ID")}
                growth={dashboardStats.stockGrowth}
                icon={<Package className="h-6 w-6 text-white" />}
                iconBgColor="bg-purple-500"
              />
              <StatsCard
                title="Transaksi Hari Ini"
                value={dashboardStats.todayTransactions.toLocaleString("id-ID")}
                growth={dashboardStats.transactionsGrowth}
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                iconBgColor="bg-orange-500"
              />
            </>
          ) : (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              <p>Gagal memuat statistik dashboard</p>
            </div>
          )}
        </div>

        {/* Recent Transactions and Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <RecentTransactions />
          <LowStockAlert />
        </div>
      </div>
    </DashboardLayout>
  )
}

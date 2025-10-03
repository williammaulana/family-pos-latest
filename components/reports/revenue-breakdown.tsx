"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"

interface RevenueData {
  period: string
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  growth: number
}

export function RevenueBreakdown() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")

  const periodOptions = [
    { value: "daily", label: "Harian" },
    { value: "weekly", label: "Mingguan" },
    { value: "monthly", label: "Bulanan" },
    { value: "yearly", label: "Tahunan" }
  ]

  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true)
      try {
        // Get data based on selected period
        let days = 30
        switch (selectedPeriod) {
          case "daily":
            days = 7
            break
          case "weekly":
            days = 28
            break
          case "monthly":
            days = 90
            break
          case "yearly":
            days = 365
            break
        }
        
        const res = await fetch(`/api/reports/sales?days=${days}`)
        const salesData = (await res.json()).data || []
        
        // Process data based on period
        let processedData: RevenueData[] = []
        
        if (selectedPeriod === "daily") {
          // Group by day
          processedData = salesData.map((item, index) => ({
            period: new Date(item.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
            totalSales: item.totalSales,
            totalTransactions: item.totalTransactions,
            averageTransaction: item.averageTransaction,
            growth: index > 0 ? ((item.totalSales - salesData[index - 1].totalSales) / salesData[index - 1].totalSales) * 100 : 0
          }))
        } else if (selectedPeriod === "weekly") {
          // Group by week
          const weeklyData = salesData.reduce((acc, item) => {
            const weekStart = new Date(item.date)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            const weekKey = weekStart.toISOString().split("T")[0]
            
            if (!acc[weekKey]) {
              acc[weekKey] = { totalSales: 0, totalTransactions: 0, dates: [] }
            }
            acc[weekKey].totalSales += item.totalSales
            acc[weekKey].totalTransactions += item.totalTransactions
            acc[weekKey].dates.push(item.date)
            return acc
          }, {} as Record<string, any>)
          
          processedData = Object.entries(weeklyData).map(([weekKey, data], index) => ({
            period: `Minggu ${index + 1}`,
            totalSales: data.totalSales,
            totalTransactions: data.totalTransactions,
            averageTransaction: data.totalSales / data.totalTransactions,
            growth: index > 0 ? ((data.totalSales - Object.values(weeklyData)[index - 1].totalSales) / Object.values(weeklyData)[index - 1].totalSales) * 100 : 0
          }))
        } else if (selectedPeriod === "monthly") {
          // Group by month
          const monthlyData = salesData.reduce((acc, item) => {
            const monthKey = item.date.substring(0, 7) // YYYY-MM
            if (!acc[monthKey]) {
              acc[monthKey] = { totalSales: 0, totalTransactions: 0 }
            }
            acc[monthKey].totalSales += item.totalSales
            acc[monthKey].totalTransactions += item.totalTransactions
            return acc
          }, {} as Record<string, any>)
          
          processedData = Object.entries(monthlyData).map(([monthKey, data], index) => ({
            period: new Date(monthKey + "-01").toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
            totalSales: data.totalSales,
            totalTransactions: data.totalTransactions,
            averageTransaction: data.totalSales / data.totalTransactions,
            growth: index > 0 ? ((data.totalSales - Object.values(monthlyData)[index - 1].totalSales) / Object.values(monthlyData)[index - 1].totalSales) * 100 : 0
          }))
        } else if (selectedPeriod === "yearly") {
          // Group by year
          const yearlyData = salesData.reduce((acc, item) => {
            const yearKey = item.date.substring(0, 4) // YYYY
            if (!acc[yearKey]) {
              acc[yearKey] = { totalSales: 0, totalTransactions: 0 }
            }
            acc[yearKey].totalSales += item.totalSales
            acc[yearKey].totalTransactions += item.totalTransactions
            return acc
          }, {} as Record<string, any>)
          
          processedData = Object.entries(yearlyData).map(([yearKey, data], index) => ({
            period: yearKey,
            totalSales: data.totalSales,
            totalTransactions: data.totalTransactions,
            averageTransaction: data.totalSales / data.totalTransactions,
            growth: index > 0 ? ((data.totalSales - Object.values(yearlyData)[index - 1].totalSales) / Object.values(yearlyData)[index - 1].totalSales) * 100 : 0
          }))
        }
        
        setRevenueData(processedData)
      } catch (error) {
        console.error("Error fetching revenue data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRevenueData()
  }, [selectedPeriod])

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <DollarSign className="h-4 w-4 text-gray-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600"
    if (growth < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getGrowthBadgeVariant = (growth: number) => {
    if (growth > 0) return "default" as const
    if (growth < 0) return "destructive" as const
    return "secondary" as const
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Breakdown Pendapatan
          </CardTitle>
          <CardDescription>Analisis pendapatan berdasarkan periode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Breakdown Pendapatan
            </CardTitle>
            <CardDescription>Analisis pendapatan berdasarkan periode</CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {revenueData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Total Penjualan</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Rata-rata</TableHead>
                  <TableHead className="text-right">Pertumbuhan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((data, index) => (
                  <TableRow key={data.period}>
                    <TableCell className="font-medium">{data.period}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(data.totalSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.totalTransactions.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(data.averageTransaction)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getGrowthIcon(data.growth)}
                        <Badge variant={getGrowthBadgeVariant(data.growth)}>
                          <span className={getGrowthColor(data.growth)}>
                            {data.growth > 0 ? "+" : ""}{data.growth.toFixed(1)}%
                          </span>
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada data pendapatan untuk ditampilkan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

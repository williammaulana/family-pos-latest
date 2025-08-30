"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { reportsService, formatCurrency } from "@/lib/supabase-service"

export function SalesChart() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const data = await reportsService.getSalesReports(7)
        setSalesData(data || [])
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  const formatTooltip = (value: number, name: string) => {
    if (name === "totalSales") {
      return [formatCurrency(value), "Total Penjualan"]
    }
    return [value.toLocaleString("id-ID"), name === "totalTransactions" ? "Transaksi" : name]
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan 7 Hari Terakhir</CardTitle>
          <CardDescription>Grafik penjualan dan jumlah transaksi harian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data penjualan...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Penjualan 7 Hari Terakhir</CardTitle>
        <CardDescription>Grafik penjualan dan jumlah transaksi harian</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                  }
                />
                <YAxis yAxisId="sales" orientation="left" tickFormatter={(value) => `${value / 1000000}M`} />
                <YAxis yAxisId="transactions" orientation="right" />
                <Tooltip formatter={formatTooltip} />
                <Line
                  yAxisId="sales"
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="totalSales"
                />
                <Line
                  yAxisId="transactions"
                  type="monotone"
                  dataKey="totalTransactions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="totalTransactions"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Belum ada data penjualan untuk ditampilkan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

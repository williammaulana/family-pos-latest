"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Calendar, TrendingUp, BarChart3 } from "lucide-react"

export function SalesChart() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("7")
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  const periodOptions = [
    { value: "7", label: "7 Hari Terakhir" },
    { value: "30", label: "30 Hari Terakhir" },
    { value: "90", label: "3 Bulan Terakhir" },
    { value: "365", label: "1 Tahun Terakhir" }
  ]

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/reports/sales?days=${Number.parseInt(selectedPeriod)}`)
        const json = await res.json()
        setSalesData(json.data || [])
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [selectedPeriod])

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

  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod)
    return option?.label || "7 Hari Terakhir"
  }

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <BarChart data={salesData}>
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
          <Bar
            yAxisId="sales"
            dataKey="totalSales"
            fill="#3b82f6"
            name="totalSales"
          />
          <Bar
            yAxisId="transactions"
            dataKey="totalTransactions"
            fill="#10b981"
            name="totalTransactions"
          />
        </BarChart>
      )
    }

    return (
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
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tren Penjualan
            </CardTitle>
            <CardDescription>{getPeriodLabel()}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
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
            <div className="flex border rounded-md">
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
                className="rounded-r-none"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="rounded-l-none"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
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

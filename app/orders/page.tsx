"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Eye, Download, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import { exportToCSV, exportToJSON } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  transaction_code: string
  customer_name: string | null
  total_amount: number
  tax_amount: number
  payment_method: string
  status: string
  created_at: string
  users: {
    name: string
  } | null
  transaction_items: {
    quantity: number
    products: {
      name: string
    }
  }[]
}

export default function OrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    } else if (user) {
      fetchTransactions()
    }
  }, [user, isLoading, router])

  const fetchTransactions = async () => {
    try {
      console.log("[v0] Fetching transactions...")

      const { data: tableCheck, error: tableError } = await supabase.from("transactions").select("id").limit(1)

      if (tableError) {
        console.error("[v0] Database tables not found. Please run migration scripts first.")
        setTransactions([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          transaction_items(
            quantity,
            products(name)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error:", error)
        throw error
      }

      console.log("[v0] Transactions fetched:", data?.length || 0)

      if (data && data.length > 0) {
        const cashierIds = [...new Set(data.map((t) => t.cashier_id).filter(Boolean))]
        const { data: users, error: usersError } = await supabase.from("users").select("id, name").in("id", cashierIds)

        if (usersError) {
          console.error("[v0] Users fetch error:", usersError)
        }

        const transactionsWithUsers = data.map((transaction) => ({
          ...transaction,
          users: users?.find((u) => u.id === transaction.cashier_id) || null,
        }))

        setTransactions(transactionsWithUsers)
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "tunai":
        return "Tunai"
      case "kartu_debit":
        return "Kartu Debit"
      case "kartu_kredit":
        return "Kartu Kredit"
      case "e_wallet":
        return "E-Wallet"
      case "qris":
        return "QRIS"
      case "transfer_bank":
        return "Transfer Bank"
      default:
        return method
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.users?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleExportCSV = () => {
    const exportData = {
      headers: [
        "Kode Transaksi",
        "Nama Pelanggan",
        "Kasir",
        "Total",
        "Pajak",
        "Metode Pembayaran",
        "Status",
        "Tanggal",
      ],
      rows: filteredTransactions.map((transaction) => [
        transaction.transaction_code,
        transaction.customer_name || "Walk-in Customer",
        transaction.users?.name || "Unknown",
        transaction.total_amount + transaction.tax_amount,
        transaction.tax_amount,
        getPaymentMethodText(transaction.payment_method),
        transaction.status === "completed" ? "Selesai" : "Dibatalkan",
        formatDate(transaction.created_at),
      ]),
      filename: `history-orders-${new Date().toISOString().split("T")[0]}`,
    }

    exportToCSV(exportData)
    toast({
      title: "Export Berhasil",
      description: "Data history orders berhasil diekspor ke CSV",
    })
  }

  const handleExportJSON = () => {
    const exportData = filteredTransactions.map((transaction) => ({
      transaction_code: transaction.transaction_code,
      customer_name: transaction.customer_name || "Walk-in Customer",
      cashier: transaction.users?.name || "Unknown",
      total_amount: transaction.total_amount + transaction.tax_amount,
      tax_amount: transaction.tax_amount,
      payment_method: getPaymentMethodText(transaction.payment_method),
      status: transaction.status === "completed" ? "Selesai" : "Dibatalkan",
      created_at: transaction.created_at,
      items: transaction.transaction_items.map((item) => ({
        product_name: item.products.name,
        quantity: item.quantity,
      })),
    }))

    exportToJSON(exportData, `history-orders-${new Date().toISOString().split("T")[0]}`)
    toast({
      title: "Export Berhasil",
      description: "Data history orders berhasil diekspor ke JSON",
    })
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

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">History Orders</h1>
            <p className="text-gray-600">Pantau semua transaksi penjualan</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON} size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan kode transaksi, nama pelanggan, atau kasir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  Semua
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  size="sm"
                >
                  Selesai
                </Button>
                <Button
                  variant={statusFilter === "cancelled" ? "default" : "outline"}
                  onClick={() => setStatusFilter("cancelled")}
                  size="sm"
                >
                  Dibatalkan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="grid gap-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-base md:text-lg">{transaction.transaction_code}</h3>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-gray-600 text-sm md:text-base">
                      {transaction.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-sm text-gray-500">Kasir: {transaction.users?.name || "Unknown"}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl md:text-2xl font-bold text-blue-600">
                      {formatCurrency(transaction.total_amount + transaction.tax_amount)}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="font-medium">{formatCurrency(transaction.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pajak</p>
                      <p className="font-medium">{formatCurrency(transaction.tax_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Metode Pembayaran</p>
                      <p className="font-medium">{getPaymentMethodText(transaction.payment_method)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Item ({transaction.transaction_items.reduce((sum, item) => sum + item.quantity, 0)} produk)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {transaction.transaction_items.slice(0, 3).map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item.quantity}x {item.products.name}
                        </Badge>
                      ))}
                      {transaction.transaction_items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{transaction.transaction_items.length - 3} lainnya
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Eye className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi ditemukan</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Belum ada transaksi yang tercatat. Pastikan tabel database sudah dibuat dengan menjalankan script migrasi."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

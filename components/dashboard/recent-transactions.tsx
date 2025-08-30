"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { transactionService, formatCurrency, formatTime } from "@/lib/supabase-service"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const data = await transactionService.getTransactions(5)
        setTransactions(data || [])
      } catch (error) {
        console.error("Error fetching recent transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentTransactions()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaksi Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{transaction.code}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {transaction.status === "completed" ? "Completed" : transaction.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{transaction.customer_name}</p>
                <p className="text-xs text-muted-foreground">{transaction.items?.length || 0} items</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(transaction.total)}</p>
                <p className="text-sm text-muted-foreground">{formatTime(new Date(transaction.created_at))}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada transaksi hari ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

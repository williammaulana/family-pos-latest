"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
 

interface StockReport {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  status: string
  lastRestocked: Date
}

export function StockStatusTable() {
  const [stockReports, setStockReports] = useState<StockReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStockReports = async () => {
      try {
        const [productsRes, lowRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/low-stock')
        ])
        const productsJson = await productsRes.json()
        const products = productsJson.data || []

        const reports: StockReport[] = products.map((product: any) => {
          let status = "normal"
          if (product.stock === 0) {
            status = "out"
          } else if (product.stock <= product.min_stock) {
            status = "low"
          }
          
          return {
            productId: product.id,
            productName: product.name,
            category: product.category,
            currentStock: product.stock,
            minStock: product.min_stock,
            status,
            lastRestocked: new Date(product.updated_at || product.created_at)
          }
        })
        setStockReports(reports)
      } catch (error) {
        console.error("Error fetching stock reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockReports()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "low":
        return <Badge variant="destructive">Menipis</Badge>
      case "out":
        return <Badge variant="destructive">Habis</Badge>
      default:
        return <Badge variant="default">Normal</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Stok</CardTitle>
        <CardDescription>Monitoring stok produk dan alert stok menipis</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Stok Saat Ini</TableHead>
              <TableHead className="text-right">Stok Minimum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir Restock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Memuat data stok...</p>
                </TableCell>
              </TableRow>
            ) : stockReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Tidak ada data stok
                </TableCell>
              </TableRow>
            ) : (
              stockReports.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.currentStock}</TableCell>
                  <TableCell className="text-right">{item.minStock}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    {item.lastRestocked.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export function ProductPerformanceTable() {
  const [productPerformance, setProductPerformance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProductPerformance = async () => {
      try {
        const res = await fetch('/api/reports/product-performance')
        const json = await res.json()
        const data = json.data || []
        const sortedProducts = [...data].sort((a: any, b: any) => b.revenue - a.revenue)
        setProductPerformance(sortedProducts)
      } catch (error) {
        console.error("Error fetching product performance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductPerformance()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performa Produk</CardTitle>
          <CardDescription>Produk terlaris berdasarkan revenue bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Terjual</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse ml-auto"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performa Produk</CardTitle>
        <CardDescription>Produk terlaris berdasarkan revenue bulan ini</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Terjual</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productPerformance.length > 0 ? (
              productPerformance.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.productName}</span>
                      {index < 3 && <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right font-medium">{product.totalSold.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(product.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-600">
                    {formatCurrency(product.profit)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data performa produk
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

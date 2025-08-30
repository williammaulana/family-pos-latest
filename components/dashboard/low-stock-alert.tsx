"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { productService } from "@/lib/supabase-service"

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const data = await productService.getLowStockProducts()
        setLowStockProducts(data || [])
      } catch (error) {
        console.error("Error fetching low stock products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLowStockProducts()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stok Menipis</CardTitle>
        <AlertTriangle className="h-5 w-5 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))
          ) : (
            <>
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      Stok: {product.stock}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Min: {product.min_stock}</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Tidak ada produk dengan stok menipis</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/types"

interface ProductGridProps {
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["Semua"])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build products URL with location filters
        const params = new URLSearchParams()
        if (user?.role !== 'superadmin') {
          // For non-superadmin users, filter by their assigned location
          if (user?.warehouseId) {
            params.append('warehouseId', user.warehouseId)
          }
          if (user?.storeId) {
            params.append('storeId', user.storeId)
          }
        }
        const productsUrl = params.toString() ? `/api/products?${params.toString()}` : '/api/products'

        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(productsUrl),
          fetch('/api/categories'),
        ])

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const productsData = await productsResponse.json()
        const categoriesData = await categoriesResponse.json()

        setProducts(productsData.data || [])
        const categoryNames = ["Semua", ...categoriesData.data.map((cat: any) => cat.name)]
        setCategories(categoryNames)
      } catch (error) {
        console.error("Error fetching products and categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode?.includes(searchTerm)
    const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.stock > 0
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Memuat produk..." disabled className="pl-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-5 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari produk atau scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4  overflow-y-auto">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {product.stock}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <p className="font-bold text-blue-600">{formatCurrency(product.price)}</p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Tidak ada produk ditemukan</p>
        </div>
      )}
    </div>
  )
}

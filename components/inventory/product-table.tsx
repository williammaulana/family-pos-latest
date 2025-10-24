'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Edit, Trash2, Plus, Minus, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductTableProps {
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  onAdjustStock: (productId: string, adjustment: number) => void
  onViewProduct?: (product: Product) => void
  refreshTrigger?: number
  selectedLocation?: string
}

export function ProductTable({
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
  onViewProduct,
  refreshTrigger,
  selectedLocation,
}: ProductTableProps) {
  const { user } = useAuth()
  const canEditProducts = user?.role === "superadmin" || user?.role === "admin_gudang" || user?.role === "super_admin" || user?.role === "admin"
  const canImportProducts = user?.role === "superadmin" || user?.role === "admin_gudang" || user?.role === "super_admin" || user?.role === "admin"
  const canViewOnly = user?.role === "admin_toko"
  const canAdjustStock = user?.role === "superadmin" || user?.role === "admin_gudang" || user?.role === "super_admin" || user?.role === "admin" || user?.role === "admin_toko"
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['Semua'])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams()

        if (user?.role === 'superadmin') {
          // For Super Admin, apply selected location filter
          if (selectedLocation && selectedLocation !== 'Semua') {
            const [type, id] = selectedLocation.split(':')
            if (type === 'warehouse') params.append('warehouseId', id)
            if (type === 'store') params.append('storeId', id)
          }
        } else if (user?.role === 'admin_toko') {
          // For admin_toko, only show products from their assigned store
          if (user?.storeId) {
            params.append('storeId', user.storeId)
          }
        } else {
          // For other roles (admin_gudang, admin, etc.), filter by their assigned location
          if (user?.warehouseId) params.append('warehouseId', user.warehouseId)
          if (user?.storeId) params.append('storeId', user.storeId)
        }

        const productsUrl = params.toString()
          ? `/api/products?${params.toString()}`
          : '/api/products'

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(productsUrl),
          fetch('/api/categories'),
        ])

        const [productsJson, categoriesJson] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ])

        setProducts(productsJson.data || [])
        setCategories(['Semua', ...(categoriesJson.data || []).map((c: any) => c.name)])
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [refreshTrigger, user, selectedLocation])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.barcode?.includes(search) ||
        product.category.toLowerCase().includes(search)
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Habis', variant: 'destructive' as const }
    if (product.stock <= (product as any).min_stock) return { label: 'Menipis', variant: 'secondary' as const }
    return { label: 'Tersedia', variant: 'default' as const }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daftar Produk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari produk, kategori, atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>


        </div>

        {/* Table Section */}
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead className="hidden md:table-cell">Harga Modal</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Barcode</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Memuat data produk...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Tidak ada produk ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const costPrice = (product as any).costPrice ?? (product as any).cost_price
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.unit ? `${product.unit}` : ''}{' '}
                            {product.barcode ? `• ${product.barcode}` : ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          {costPrice && (
                            <p className="text-xs text-muted-foreground">
                              Profit: {formatCurrency(product.price - Number(costPrice))}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="font-medium">{formatCurrency(costPrice || 0)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{product.stock}</span>
                          <span className="text-xs text-muted-foreground">
                            / min {(product as any).min_stock ?? (product as any).minStock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {product.barcode || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          {canAdjustStock && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAdjustStock(product.id, -1)}
                                disabled={product.stock === 0}
                                className="h-8 px-2"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAdjustStock(product.id, 1)}
                                className="h-8 px-2"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {onViewProduct && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewProduct(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {canEditProducts && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditProduct(product)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteProduct(product.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

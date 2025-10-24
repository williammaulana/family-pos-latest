"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductTable } from "@/components/inventory/product-table"
import { ProductForm } from "@/components/inventory/product-form"
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog"
import { ProductDetailDialog } from "@/components/inventory/product-detail-dialog"
import { ProductImportDialog } from "@/components/inventory/product-import-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Package, AlertTriangle, TrendingUp, Download, Upload } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/types"
import { exportToCSV, exportToJSON, exportToExcel } from "@/lib/export-utils"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailProduct, setDetailProduct] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(['Semua'])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState('Semua')
  const [locations, setLocations] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
    if (!isLoading && user && user.role === "kasir") {
      router.push("/dashboard")
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses ke halaman inventory",
        variant: "destructive",
      })
    }
  }, [user, isLoading, router, toast])

  // Check if user can perform CRUD operations
  const canEditProducts = user?.role === "superadmin" || user?.role === "admin_gudang" || user?.role === "super_admin" || user?.role === "admin"
  const canImportProducts = user?.role === "superadmin" || user?.role === "admin_gudang" || user?.role === "super_admin" || user?.role === "admin"
  const canViewOnly = user?.role === "admin_toko"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locations for Super Admin
        if (user?.role === 'superadmin' || user?.role === 'super_admin') {
          const locationsRes = await fetch('/api/locations')
          const locationsJson = await locationsRes.json()
          const locationOptions = [
            { id: 'Semua', name: 'Semua Lokasi', type: 'all' },
            ...(locationsJson.data || []).map((loc: any) => ({
              id: `${loc.type}:${loc.id}`,
              name: loc.name,
              type: loc.type,
            })),
          ]
          setLocations(locationOptions)
        }

        // Fetch products based on location filter
        const params = new URLSearchParams()
        if (user?.role === 'superadmin' || user?.role === 'super_admin') {
          // For Super Admin, apply selected location filter
          if (selectedLocation !== 'Semua') {
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
          if (user?.warehouseId) {
            params.append('warehouseId', user.warehouseId)
          }
          if (user?.storeId) {
            params.append('storeId', user.storeId)
          }
        }

        const url = params.toString() ? `/api/products?${params.toString()}` : '/api/products'
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(url),
          fetch('/api/categories'),
        ])

        const [productsJson, categoriesJson] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ])

        setProducts(productsJson.data || [])
        setCategories(['Semua', ...(categoriesJson.data || []).map((c: any) => c.name)])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user && user.role !== "kasir") {
      fetchData()
    }
  }, [user, refreshTrigger, selectedLocation])

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsProductFormOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setDetailProduct(product as any)
    setIsDetailOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return

    setIsProcessing(true)
    try {
      await fetch(`/api/products?id=${productId}`, { method: 'DELETE' })
      toast({
        title: "Produk dihapus",
        description: "Produk berhasil dihapus dari inventory",
      })
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Gagal menghapus produk",
        description: "Terjadi kesalahan saat menghapus produk",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAdjustStock = async (productId: string, adjustment: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (adjustment === 1 || adjustment === -1) {
      // Quick adjustment
      await handleQuickStockAdjustment(product, adjustment)
    } else {
      // Open dialog for detailed adjustment
      setSelectedProduct(product)
      setIsStockAdjustmentOpen(true)
    }
  }

  const handleQuickStockAdjustment = async (product: any, adjustment: number) => {
    setIsProcessing(true)
    try {
      const newStock = Math.max(0, product.stock + adjustment)
      await fetch(`/api/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, stock: newStock }) })
      toast({
        title: "Stok disesuaikan",
        description: `Stok ${product.name} ${adjustment > 0 ? "ditambah" : "dikurangi"} ${Math.abs(adjustment)}`,
      })
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Gagal menyesuaikan stok",
        description: "Terjadi kesalahan saat menyesuaikan stok",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    setIsProcessing(true)
    try {
      if (selectedProduct) {
        // Normalize camelCase to API expectations
        const payload: any = { id: selectedProduct.id, ...productData }
        if ((payload as any).minStock !== undefined) {
          payload.minStock = Number(payload.minStock)
        }
        if ((payload as any).costPrice !== undefined) {
          payload.costPrice = Number(payload.costPrice)
        }
        await fetch(`/api/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        toast({
          title: "Produk diperbarui",
          description: "Informasi produk berhasil diperbarui",
        })
      } else {
        const payload: any = { ...productData }
        await fetch(`/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        toast({
          title: "Produk ditambahkan",
          description: "Produk baru berhasil ditambahkan ke inventory",
        })
      }
      setIsProductFormOpen(false)
      setSelectedProduct(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Gagal menyimpan produk",
        description: "Terjadi kesalahan saat menyimpan produk",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStockAdjustment = async (adjustment: number, reason: string, type: string) => {
    if (!selectedProduct) return

    setIsProcessing(true)
    try {
      const currentStock = products.find((p) => p.id === selectedProduct.id)?.stock || 0
      const newStock = type === "add" ? currentStock + adjustment : Math.max(0, currentStock - adjustment)

      await fetch(`/api/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedProduct.id, stock: newStock }) })
      toast({
        title: "Stok disesuaikan",
        description: `Stok ${selectedProduct.name} berhasil ${type === "add" ? "ditambah" : "dikurangi"}`,
      })
      setIsStockAdjustmentOpen(false)
      setSelectedProduct(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Gagal menyesuaikan stok",
        description: "Terjadi kesalahan saat menyesuaikan stok",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportProducts = (format: "csv" | "excel" | "json" = "csv") => {
    if (format === "json") {
      exportToJSON(products, `products-${new Date().toISOString().split("T")[0]}`)
      toast({
        title: "Export Berhasil",
        description: "Data produk berhasil diekspor ke JSON",
      })
      return
    }

    const exportData = {
      headers: ["Nama Produk", "SKU", "Kategori", "Harga", "Stok", "Stok Minimum", "Status"],
      rows: products.map((product) => [
        product.name,
        product.sku,
        product.category,
        product.price,
        product.stock,
        product.min_stock,
        product.stock <= product.min_stock ? "Stok Menipis" : "Normal",
      ]),
      filename: `products-${new Date().toISOString().split("T")[0]}`,
    }

    if (format === "excel") {
      exportToExcel(exportData)
      toast({
        title: "Export Berhasil",
        description: "Data produk berhasil diekspor ke Excel",
      })
    } else {
      exportToCSV(exportData)
      toast({
        title: "Export Berhasil",
        description: "Data produk berhasil diekspor ke CSV",
      })
    }
  }

  const handleExportJSON = () => {
    exportToJSON(products, `products-${new Date().toISOString().split("T")[0]}`)
    toast({
      title: "Export Berhasil",
      description: "Data produk berhasil diekspor ke JSON",
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

  if (!user || user.role === "kasir") {
    return null
  }

  const totalProducts = products.length
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock).length
  const outOfStockProducts = products.filter((p) => p.stock === 0).length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  return (
    <DashboardLayout title="Manajemen Inventory">
      <div className="flex flex-col h-full space-y-4 md:space-y-6 px-3 md:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-lg md:text-2xl font-bold">{totalProducts}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Stok Menipis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-lg md:text-2xl font-bold text-orange-600">{lowStockProducts}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Stok Habis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-lg md:text-2xl font-bold text-red-600">{outOfStockProducts}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Nilai Inventory</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-base md:text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0 max-w-full">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">Daftar Produk</h2>
            <p className="text-sm text-muted-foreground">Kelola produk dan stok inventory</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
            {/* Location Filter for Super Admin */}
            {user?.role === 'superadmin' || user?.role === "super_admin" && (
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportProducts("excel")}>Export Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportProducts("csv")}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportProducts("json")}>Export JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEditProducts && !canViewOnly && (
              <>
                {canImportProducts && (
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                )}
                <Button onClick={() => setIsProductFormOpen(true)} size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 min-h-0 overflow-x-auto">
          <ProductTable
            products={products}
            categories={categories}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
            onViewProduct={handleViewProduct}
            isLoading={statsLoading}
          />
        </div>

        {/* Dialogs */}
        <ProductForm
          product={selectedProduct}
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false)
            setSelectedProduct(null)
          }}
          onSave={handleSaveProduct}
          isLoading={isProcessing}
        />

        <StockAdjustmentDialog
          isOpen={isStockAdjustmentOpen}
          onClose={() => {
            setIsStockAdjustmentOpen(false)
            setSelectedProduct(null)
          }}
          onAdjust={handleStockAdjustment}
          productName={selectedProduct?.name || ""}
          currentStock={selectedProduct?.stock || 0}
          isLoading={isProcessing}
        />

        <ProductDetailDialog
          product={detailProduct}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setDetailProduct(null)
          }}
        />

        <ProductImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportComplete={() => {
            setRefreshTrigger((prev) => prev + 1)
            toast({
              title: "Import Berhasil",
              description: "Produk berhasil diimpor ke inventory",
            })
          }}
        />
      </div>
    </DashboardLayout>
  )
}

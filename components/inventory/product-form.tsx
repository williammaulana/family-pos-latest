"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product } from "@/types"
import { warehouseService, storeService } from "@/lib/locations-service"

interface ProductFormProps {
  product?: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Partial<Product>) => void
  isLoading?: boolean
}

const categories = ["Makanan", "Minuman", "Kebersihan", "Elektronik", "Pakaian", "Lainnya"]
const units = ["pcs", "dus", "liter", "kg", "gram", "meter", "cm", "buah", "bungkus", "botol", "kaleng", "paket"]

export function ProductForm({ product, isOpen, onClose, onSave, isLoading }: ProductFormProps) {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    costPrice: "",
    stock: "",
    minStock: "",
    barcode: "",
    unit: "",
    description: "",
    locationType: "warehouse" as "warehouse" | "store",
    locationId: "",
  })

  useEffect(() => {
    ;(async () => {
      const [ws, ss] = await Promise.all([warehouseService.list(), storeService.list()])
      setWarehouses(ws || [])
      setStores(ss || [])
    })()
  }, [])

  useEffect(() => {
    if (product) {
      const snake: any = product as any
      setFormData({
        name: product.name || "",
        category: (snake.category ?? "") as string,
        price: String(product.price ?? snake.price ?? ""),
        costPrice:
          snake.cost_price !== undefined && snake.cost_price !== null
            ? String(snake.cost_price)
            : product.costPrice !== undefined && product.costPrice !== null
              ? String(product.costPrice)
              : "",
        stock: String(product.stock ?? snake.stock ?? ""),
        minStock: String((product as any).minStock ?? snake.min_stock ?? ""),
        barcode: (product.barcode ?? snake.barcode ?? "") as string,
        unit: (product.unit ?? snake.unit ?? "") as string,
        description: (snake.description ?? "") as string,
        locationType: "warehouse",
        locationId: "",
      })
    } else {
      setFormData({
        name: "",
        category: "",
        price: "",
        costPrice: "",
        stock: "",
        minStock: "",
        barcode: "",
        unit: "",
        description: "",
        locationType: "warehouse",
        locationId: "",
      })
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const productData: any = {
      name: formData.name,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      costPrice: formData.costPrice ? Number.parseFloat(formData.costPrice) : undefined,
      stock: Number.parseInt(formData.stock),
      minStock: Number.parseInt(formData.minStock),
      barcode: formData.barcode || undefined,
      unit: formData.unit || undefined,
    }

    if (product) {
      productData.id = product.id
    } else {
      // For new products, include location data
      productData.locationType = formData.locationType
      productData.locationId = formData.locationId
    }

    onSave(productData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
          <DialogDescription>
            {product ? "Ubah informasi produk di bawah ini." : "Masukkan informasi produk baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama produk"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga Jual *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Harga Modal</Label>
              <Input
                id="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleInputChange("costPrice", e.target.value)}
                placeholder="0"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Satuan</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Scan atau masukkan barcode"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stok Awal *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stok Minimum *</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          {!product && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">Lokasi Stok *</Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value: "warehouse" | "store") => handleInputChange("locationType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Gudang</SelectItem>
                    <SelectItem value="store">Toko</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationId">Pilih {formData.locationType === "warehouse" ? "Gudang" : "Toko"} *</Label>
                <Select value={formData.locationId} onValueChange={(value) => handleInputChange("locationId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Pilih ${formData.locationType === "warehouse" ? "gudang" : "toko"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.locationType === "warehouse" ? warehouses : stores).map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Deskripsi produk (opsional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : product ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

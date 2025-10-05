"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface ProductDetailDialogProps {
  product: any | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailDialog({ product, isOpen, onClose }: ProductDetailDialogProps) {
  const costPrice = product ? (product.costPrice ?? product.cost_price) : undefined
  const minStock = product ? (product.minStock ?? product.min_stock) : undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Detail Produk</DialogTitle>
          <DialogDescription>Informasi lengkap produk</DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Nama</div>
              <div className="font-medium">{product.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Kategori</div>
                <div className="font-medium">{product.category}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Barcode</div>
                <div className="font-medium">{product.barcode || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Harga Jual</div>
                <div className="font-semibold text-blue-600">{formatCurrency(product.price)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Harga Modal</div>
                <div className="font-semibold">{costPrice !== undefined ? formatCurrency(Number(costPrice)) : '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <div className="text-xs text-muted-foreground">Stok</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{product.stock}</Badge>
                  {minStock !== undefined && <span className="text-xs text-muted-foreground">/ min {minStock}</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Satuan</div>
                <div className="font-medium">{product.unit || '-'}</div>
              </div>
            </div>
            {product.description && (
              <div>
                <div className="text-xs text-muted-foreground">Deskripsi</div>
                <div className="text-sm">{product.description}</div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


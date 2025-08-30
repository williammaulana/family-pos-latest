"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/supabase-service"
import type { TransactionItem } from "@/types"

interface ShoppingCartProps {
  items: TransactionItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
}

export function ShoppingCart({ items, onUpdateQuantity, onRemoveItem, onClearCart }: ShoppingCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between pb-4">
          <CardTitle>Keranjang Belanja</CardTitle>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearCart}>
              <Trash2 className="h-4 w-4 mr-1" />
              Kosongkan
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col flex-1 min-h-0 space-y-4">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-8 text-muted-foreground">
              <div>
                <p>Keranjang kosong</p>
                <p className="text-sm">Tambahkan produk untuk memulai transaksi</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto max-h-[300px] pr-2 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => onUpdateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => onUpdateQuantity(item.productId, Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                        min="0"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right min-w-20 flex-shrink-0">
                      <p className="font-medium text-sm">{formatCurrency(item.subtotal)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.productId)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 mt-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 pt-4 border-t bg-white">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pajak (10%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

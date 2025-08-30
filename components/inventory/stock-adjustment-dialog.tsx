"use client"

import type React from "react"

import { useState } from "react"
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

interface StockAdjustmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdjust: (adjustment: number, reason: string, type: string) => void
  productName: string
  currentStock: number
  isLoading?: boolean
}

export function StockAdjustmentDialog({
  isOpen,
  onClose,
  onAdjust,
  productName,
  currentStock,
  isLoading,
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState("add")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const adjustment = adjustmentType === "add" ? Number.parseInt(quantity) : -Number.parseInt(quantity)
    onAdjust(adjustment, reason, adjustmentType)
    setQuantity("")
    setReason("")
  }

  const newStock =
    adjustmentType === "add"
      ? currentStock + Number.parseInt(quantity || "0")
      : currentStock - Number.parseInt(quantity || "0")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok</DialogTitle>
          <DialogDescription>
            Sesuaikan stok untuk produk: <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis Penyesuaian</Label>
            <Select value={adjustmentType} onValueChange={setAdjustmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Tambah Stok</SelectItem>
                <SelectItem value="reduce">Kurangi Stok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan penyesuaian stok"
              rows={3}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Stok Saat Ini:</span>
              <span className="font-medium">{currentStock}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Penyesuaian:</span>
              <span className={adjustmentType === "add" ? "text-green-600" : "text-red-600"}>
                {adjustmentType === "add" ? "+" : "-"}
                {quantity || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
              <span>Stok Baru:</span>
              <span className={newStock < 0 ? "text-red-600" : ""}>{newStock}</span>
            </div>
          </div>

          {newStock < 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Peringatan: Stok tidak boleh kurang dari 0</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || newStock < 0}>
              {isLoading ? "Memproses..." : "Sesuaikan Stok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

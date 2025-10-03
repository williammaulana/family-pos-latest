'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import type { Product } from '@/lib/mysql-service'
import { StockHistory } from '@/types'

export default function StockAdjustmentPage() {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchStockHistory()
  }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) {
      setProducts(data.data)
    }
  }

  const fetchStockHistory = async () => {
    const res = await fetch('/api/inventory/history')
    const data = await res.json()
    if (data.success) {
      setStockHistory(data.data)
    }
  }

  const handleAdjustment = async () => {
    if (!productId || quantity === 0) {
      toast({
        title: 'Error',
        description: 'Produk dan jumlah harus diisi.',
        variant: 'destructive',
      })
      return
    }

    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, reason }),
    })

    const data = await res.json()

    if (data.success) {
      toast({
        title: 'Sukses',
        description: 'Stok berhasil disesuaikan.',
      })
      setProductId('')
      setQuantity(0)
      setReason('')
      fetchStockHistory() // Refresh history
    } else {
      toast({
        title: 'Error',
        description: data.error || 'Gagal menyesuaikan stok.',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Penyesuaian Stok</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Produk</Label>
              <Select onValueChange={setProductId} value={productId}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih produk...' />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='quantity'>Jumlah</Label>
              <Input
                id='quantity'
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              />
              <p className='text-xs text-muted-foreground'>
                Gunakan nilai positif untuk stok masuk dan negatif untuk stok keluar.
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='reason'>Alasan</Label>
              <Input
                id='reason'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Contoh: Stok opname, barang rusak, dll.'
              />
            </div>
            <Button onClick={handleAdjustment}>Simpan Penyesuaian</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pergerakan Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Perubahan</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell
                      className={item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change}
                    </TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

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
// Use product shape from API response, not MySQL service types
import type { Product } from '@/types'
import { StockHistory } from '@/types'
import { useAuth } from '@/lib/auth'
import { docService, storeService } from '@/lib/locations-service'
import { Select as UiSelect, SelectContent as UiSelectContent, SelectItem as UiSelectItem, SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue } from '@/components/ui/select'

export default function StockAdjustmentPage() {
  const { user } = useAuth()
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase')
  const [targetStoreId, setTargetStoreId] = useState<string>('')
  const [stores, setStores] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchStockHistory()
    ;(async () => {
      try {
        const list = await storeService.list()
        setStores(list as any)
      } catch {}
    })()
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
    // If admin_gudang and targetStoreId selected, create approval request instead of direct change
    if (user && ['superadmin','admin_gudang'].includes(user.role as any) && targetStoreId) {
      const nomor = await docService.generateNomor('AR')
      await docService.createAdjustRequest({
        nomor,
        warehouse_id: '', // left blank; could be derived from mapping if needed
        store_id: targetStoreId,
        type: adjustType,
        tanggal: new Date().toISOString().slice(0,10),
        requested_by: user.id,
        note: reason || null,
        items: [{ product_id: productId, quantity: Math.abs(quantity) || 1 }],
      })
      toast({ title: 'Terkirim', description: 'Permintaan penyesuaian dikirim untuk persetujuan toko' })
      setProductId('')
      setQuantity(0)
      setReason('')
      setTargetStoreId('')
      return
    }

    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: adjustType === 'increase' ? Math.abs(quantity) : -Math.abs(quantity), reason }),
    })

    const data = await res.json()

    if (data.success) {
      toast({ title: 'Sukses', description: 'Stok berhasil disesuaikan.' })
      setProductId('')
      setQuantity(0)
      setReason('')
      fetchStockHistory()
    } else {
      toast({ title: 'Error', description: data.error || 'Gagal menyesuaikan stok.', variant: 'destructive' })
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>Tipe</Label>
                <UiSelect value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                  <UiSelectTrigger>
                    <UiSelectValue placeholder='Pilih tipe' />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem value='increase'>Tambah (Masuk)</UiSelectItem>
                    <UiSelectItem value='decrease'>Kurang (Keluar)</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div className='space-y-2'>
                <Label>Target Toko (opsional)</Label>
                <UiSelect value={targetStoreId} onValueChange={(v: any) => setTargetStoreId(v)}>
                  <UiSelectTrigger>
                    <UiSelectValue placeholder='Pilih toko tujuan (opsional)' />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    {stores.map((s) => (
                      <UiSelectItem key={s.id} value={s.id}>{s.name}</UiSelectItem>
                    ))}
                  </UiSelectContent>
                </UiSelect>
                <p className='text-xs text-muted-foreground'>Jika dipilih, akan membuat permintaan persetujuan ke toko</p>
              </div>
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

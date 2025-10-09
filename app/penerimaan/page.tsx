"use client"

import { useEffect, useState } from "react"
import { docService, warehouseService } from "@/lib/locations-service"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/layout"

export default function PenerimaanPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState<{
    warehouse_id: string
    pemasok: string
    tanggal: string
    items: Array<{ product_id: string; quantity: number }>
  }>({
    warehouse_id: "",
    pemasok: "",
    tanggal: new Date().toISOString().slice(0, 10),
    items: [],
  })
  const canAccess = user && ["superadmin", "admin_gudang", "admin_toko"].includes(user.role as any)

  useEffect(() => {
    ;(async () => {
      const [list, ws, ps] = await Promise.all([
        docService.listPenerimaan(),
        warehouseService.list(),
        supabase.from("products").select("id,name").order("name"),
      ])
      setRows((list as any) || [])
      setWarehouses(ws || [])
      setProducts(ps.data || [])
    })()
  }, [])

  if (!canAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Anda tidak memiliki akses ke halaman ini.</CardContent>
        </Card>
      </div>
    )
  }

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { product_id: products[0]?.id || "", quantity: 1 }] }))
  const updateItem = (idx: number, patch: Partial<{ product_id: string; quantity: number }>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }))

  const submit = async () => {
    if (!form.warehouse_id || form.items.length === 0) {
      toast({ title: "Validasi", description: "Gudang dan minimal 1 item wajib diisi", variant: "destructive" })
      return
    }
    const nomor = await docService.generateNomor("PN")
    await docService.createPenerimaan({
      nomor,
      warehouse_id: form.warehouse_id,
      pemasok: form.pemasok || null,
      tanggal: form.tanggal,
      dibuat_oleh: user?.id || "system",
      items: form.items,
    })
    setRows(await docService.listPenerimaan())
    toast({ title: "Berhasil", description: "Penerimaan dibuat (Draft). ACC untuk menambah stok." })
  }

  const approve = async (id: string) => {
    await docService.approvePenerimaan(id)
    setRows(await docService.listPenerimaan())
    toast({ title: "Disetujui", description: "Penerimaan disetujui. Stok gudang bertambah." })
  }

  return (
    <DashboardLayout title="Penerimaan Barang">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buat Penerimaan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Gudang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Pemasok (opsional)"
                value={form.pemasok}
                onChange={(e) => setForm({ ...form, pemasok: e.target.value })}
              />
              <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <div className="font-medium">Item</div>
                <Button variant="outline" onClick={addItem}>
                  Tambah Item
                </Button>
              </div>
              {form.items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada item</p>}
              {form.items.map((it, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-2">
                  <Select value={it.product_id} onValueChange={(v) => updateItem(idx, { product_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem value={p.id} key={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={submit}>Simpan Draft</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Penerimaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Nomor</th>
                    <th className="py-2">Gudang</th>
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{r.nomor}</td>
                      <td className="py-2">{r.warehouse?.name || "-"}</td>
                      <td className="py-2">{r.tanggal?.slice(0, 10)}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2 flex gap-2">
                        {r.status !== "Disetujui" && (
                          <Button size="sm" onClick={() => approve(r.id)}>
                            ACC
                          </Button>
                        )}
                        <Link href={`/penerimaan/${r.id}/print`}>
                          <Button size="sm" variant="outline">
                            Cetak
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Belum ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

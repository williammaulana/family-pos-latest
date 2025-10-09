"use client"

import { useEffect, useState } from "react"
import { docService, warehouseService, storeService } from "@/lib/locations-service"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/layout"

export default function SuratJalanPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState<{
    dari_gudang_id: string
    ke_type: "gudang" | "toko" | ""
    ke_id: string
    sopir: string
    nomor_kendaraan: string
    tanggal: string
    items: Array<{ product_id: string; quantity: number }>
  }>({
    dari_gudang_id: "",
    ke_type: "",
    ke_id: "",
    sopir: "",
    nomor_kendaraan: "",
    tanggal: new Date().toISOString().slice(0, 10),
    items: [],
  })
  const canAccess = user && ["superadmin", "admin_gudang"].includes(user.role as any)

  useEffect(() => {
    ;(async () => {
      const [list, ws, ss, ps] = await Promise.all([
        docService.listSuratJalan(),
        warehouseService.list(),
        storeService.list(),
        supabase.from("products").select("id,name").order("name"),
      ])
      setRows((list as any) || [])
      setWarehouses(ws || [])
      setStores(ss || [])
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
    if (!form.dari_gudang_id || !form.ke_type || !form.ke_id || form.items.length === 0) {
      return toast({ title: "Validasi", description: "Lengkapi data wajib", variant: "destructive" })
    }
    const nomor = await docService.generateNomor("SJ")
    await docService.createSuratJalan({
      nomor,
      dari_gudang_id: form.dari_gudang_id,
      ke_gudang_id: form.ke_type === "gudang" ? form.ke_id : null,
      ke_toko_id: form.ke_type === "toko" ? form.ke_id : null,
      sopir: form.sopir || null,
      nomor_kendaraan: form.nomor_kendaraan || null,
      tanggal: form.tanggal,
      dibuat_oleh: user?.id || "system",
      items: form.items,
    })
    setRows(await docService.listSuratJalan())
    toast({ title: "Berhasil", description: "Surat Jalan dibuat (Draft). ACC untuk proses stok." })
  }

  const approve = async (id: string) => {
    await docService.approveSuratJalan(id)
    setRows(await docService.listSuratJalan())
    toast({ title: "Disetujui", description: "Surat Jalan disetujui. Stok tersinkron otomatis." })
  }

  return (
    <DashboardLayout title="Surat Jalan">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buat Surat Jalan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Select value={form.dari_gudang_id} onValueChange={(v) => setForm({ ...form, dari_gudang_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Gudang Asal" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.ke_type} onValueChange={(v: any) => setForm({ ...form, ke_type: v, ke_id: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gudang">Gudang</SelectItem>
                  <SelectItem value="toko">Toko</SelectItem>
                </SelectContent>
              </Select>
              {form.ke_type === "gudang" ? (
                <Select value={form.ke_id} onValueChange={(v) => setForm({ ...form, ke_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gudang Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : form.ke_type === "toko" ? (
                <Select value={form.ke_id} onValueChange={(v) => setForm({ ...form, ke_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Toko Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div />
              )}
              <Input
                placeholder="Sopir (opsional)"
                value={form.sopir}
                onChange={(e) => setForm({ ...form, sopir: e.target.value })}
              />
              <Input
                placeholder="No. Kendaraan (opsional)"
                value={form.nomor_kendaraan}
                onChange={(e) => setForm({ ...form, nomor_kendaraan: e.target.value })}
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
            <CardTitle>Daftar Surat Jalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Nomor</th>
                    <th className="py-2">Asal</th>
                    <th className="py-2">Tujuan</th>
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{r.nomor}</td>
                      <td className="py-2">{r.dari?.name || "-"}</td>
                      <td className="py-2">{r.ke_gudang?.name || r.ke_toko?.name || "-"}</td>
                      <td className="py-2">{r.tanggal?.slice(0, 10)}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2 flex gap-2">
                        {r.status !== "Disetujui" && (
                          <Button size="sm" onClick={() => approve(r.id)}>
                            ACC
                          </Button>
                        )}
                        <Link href={`/surat-jalan/${r.id}/print`}>
                          <Button size="sm" variant="outline">
                            Cetak
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
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

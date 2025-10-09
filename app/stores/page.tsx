"use client"

import { useEffect, useState } from "react"
import { storeService, warehouseService } from "@/lib/locations-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard/layout"

export default function StoresPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [form, setForm] = useState<{ code: string; name: string; address: string; warehouse_id: string | null }>({
    code: "",
    name: "",
    address: "",
    warehouse_id: null,
  })
  const canAccess = user && ["superadmin", "admin_gudang"].includes(user.role as any)

  useEffect(() => {
    ;(async () => {
      const [s, w] = await Promise.all([storeService.list(), warehouseService.list()])
      setRows(s || [])
      setWarehouses(w || [])
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

  const submit = async () => {
    if (!form.code || !form.name) {
      toast({ title: "Validasi", description: "Kode dan Nama wajib diisi", variant: "destructive" })
      return
    }
    await storeService.create({
      code: form.code,
      name: form.name,
      address: form.address || null,
      warehouse_id: form.warehouse_id,
    })
    setForm({ code: "", name: "", address: "", warehouse_id: null })
    setRows(await storeService.list())
    toast({ title: "Berhasil", description: "Toko berhasil disimpan" })
  }

  return (
    <DashboardLayout title="Manajemen Toko">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Toko</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-3">
            <Input
              placeholder="Kode Toko"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Input
              placeholder="Nama Toko"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Alamat (opsional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Select
              value={form.warehouse_id ?? ""}
              onValueChange={(v) => setForm({ ...form, warehouse_id: v || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Gudang Utama" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem value={w.id} key={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:col-span-4 flex justify-end">
              <Button onClick={submit}>Simpan</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Toko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Kode</th>
                    <th className="py-2">Nama</th>
                    <th className="py-2">Gudang Utama</th>
                    <th className="py-2">Alamat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">{s.code}</td>
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">{s.warehouses?.name || "-"}</td>
                      <td className="py-2">{s.address || "-"}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
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

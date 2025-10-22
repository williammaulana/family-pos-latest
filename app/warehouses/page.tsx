"use client"

import { useEffect, useState } from "react"
import { warehouseService } from "@/lib/locations-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard/layout"

export default function WarehousesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState({ code: "", name: "", address: "" })
  const canAccess = user && ["super_admin", "superadmin", "admin_gudang"].includes(user.role as any)

  useEffect(() => {
    ;(async () => {
      const data = await warehouseService.list()
      setRows(data || [])
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
    await warehouseService.create({ code: form.code, name: form.name, address: form.address || null })
    setForm({ code: "", name: "", address: "" })
    setRows(await warehouseService.list())
    toast({ title: "Berhasil", description: "Gudang berhasil disimpan" })
  }

  return (
    <DashboardLayout title="Manajemen Gudang">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Gudang</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="Kode Gudang"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Input
              placeholder="Nama Gudang"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Alamat (opsional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={submit}>Simpan</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Gudang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Kode</th>
                    <th className="py-2">Nama</th>
                    <th className="py-2">Alamat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="py-2">{w.code}</td>
                      <td className="py-2">{w.name}</td>
                      <td className="py-2">{w.address || "-"}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted-foreground">
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

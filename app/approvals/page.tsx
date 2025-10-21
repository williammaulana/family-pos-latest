"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { docService } from "@/lib/locations-service"
import { useAuth } from "@/lib/auth"

export default function ApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [openItems, setOpenItems] = useState<Record<string, any[] | undefined>>({})
  const [openReqItems, setOpenReqItems] = useState<Record<string, any[] | undefined>>({})

  const canAccess = user && ["superadmin", "admin_toko"].includes(user.role as any)

  useEffect(() => {
    ;(async () => {
      const [reqs, sjs] = await Promise.all([
        docService.listAdjustRequests(),
        docService.listSuratJalan(),
      ])
      setRequests((reqs as any) || [])
      setShipments(((sjs as any) || []).filter((r: any) => !!r.ke_toko && r.status !== "Disetujui"))
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

  const approve = async (id: string) => {
    await docService.approveAdjustRequest(id, user?.id || "system")
    const [reqs, sjs] = await Promise.all([
      docService.listAdjustRequests(),
      docService.listSuratJalan(),
    ])
    setRequests((reqs as any) || [])
    setShipments(((sjs as any) || []).filter((r: any) => !!r.ke_toko && r.status !== "Disetujui"))
    toast({ title: "Disetujui", description: "Permintaan penyesuaian disetujui" })
  }

  const reject = async (id: string) => {
    await docService.rejectAdjustRequest(id, user?.id || "system")
    const [reqs, sjs] = await Promise.all([
      docService.listAdjustRequests(),
      docService.listSuratJalan(),
    ])
    setRequests((reqs as any) || [])
    setShipments(((sjs as any) || []).filter((r: any) => !!r.ke_toko && r.status !== "Disetujui"))
    toast({ title: "Ditolak", description: "Permintaan penyesuaian ditolak" })
  }

  const approveShipment = async (id: string) => {
    await docService.approveSuratJalan(id)
    const sjs = (await docService.listSuratJalan()) as any
    setShipments((sjs || []).filter((r: any) => !!r.ke_toko && r.status !== "Disetujui"))
    toast({ title: "Disetujui", description: "Surat Jalan disetujui. Stok toko akan bertambah." })
  }

  const toggleItems = async (id: string) => {
    if (openItems[id]) {
      const { [id]: _, ...rest } = openItems
      setOpenItems(rest)
      return
    }
    const items = (await docService.getSuratJalanItems(id)) as any[]
    setOpenItems({ ...openItems, [id]: items })
  }

  const toggleReqItems = async (id: string) => {
    if (openReqItems[id]) {
      const { [id]: _, ...rest } = openReqItems
      setOpenReqItems(rest)
      return
    }
    const items = (await docService.getAdjustRequestItems(id)) as any[]
    setOpenReqItems({ ...openReqItems, [id]: items })
  }

  return (
    <DashboardLayout title="Persetujuan">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permintaan Penyesuaian Stok Toko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Nomor</th>
                    <th className="py-2">Gudang</th>
                    <th className="py-2">Toko</th>
                    <th className="py-2">Tipe</th>
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <>
                      <tr key={r.id} className="border-t">
                        <td className="py-2">{r.nomor}</td>
                        <td className="py-2">{r.gudang?.name || "-"}</td>
                        <td className="py-2">{r.toko?.name || "-"}</td>
                        <td className="py-2 capitalize">{r.type}</td>
                        <td className="py-2">{String(r.tanggal).slice(0, 10)}</td>
                        <td className="py-2">{r.status}</td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleReqItems(r.id)}>Lihat Item</Button>
                          {r.status === "Draft" && (
                            <>
                              <Button size="sm" onClick={() => approve(r.id)}>ACC</Button>
                              <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>Tolak</Button>
                            </>
                          )}
                        </td>
                      </tr>
                      {openReqItems[r.id] && (
                        <tr className="bg-muted/30">
                          <td colSpan={7} className="p-3">
                            <div className="grid gap-2">
                              {(openReqItems[r.id] || []).map((it) => (
                                <div key={it.id} className="flex justify-between text-sm">
                                  <div>{it.products?.name || '-'}</div>
                                  <div className="font-medium">{it.quantity}</div>
                                </div>
                              ))}
                              {(!openReqItems[r.id] || openReqItems[r.id]?.length === 0) && (
                                <div className="text-sm text-muted-foreground">Tidak ada item</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">Belum ada permintaan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengiriman ke Toko (Menunggu ACC Toko)</CardTitle>
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
                  {shipments.map((r) => (
                    <>
                      <tr key={r.id} className="border-t">
                        <td className="py-2">{r.nomor}</td>
                        <td className="py-2">{r.dari?.name || "-"}</td>
                        <td className="py-2">{r.ke_toko?.name || "-"}</td>
                        <td className="py-2">{String(r.tanggal).slice(0, 10)}</td>
                        <td className="py-2">{r.status}</td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleItems(r.id)}>Lihat Item</Button>
                          <Button size="sm" onClick={() => approveShipment(r.id)}>ACC</Button>
                        </td>
                      </tr>
                      {openItems[r.id] && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="p-3">
                            <div className="grid gap-2">
                              {(openItems[r.id] || []).map((it) => (
                                <div key={it.id} className="flex justify-between text-sm">
                                  <div>{it.products?.name || '-'}</div>
                                  <div className="font-medium">{it.quantity}</div>
                                </div>
                              ))}
                              {(!openItems[r.id] || openItems[r.id]?.length === 0) && (
                                <div className="text-sm text-muted-foreground">Tidak ada item</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">Tidak ada pengiriman menunggu ACC</td>
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

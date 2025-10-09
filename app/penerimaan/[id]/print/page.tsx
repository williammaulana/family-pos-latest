"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function PrintPenerimaanPage() {
  const params = useParams<{ id: string }>()
  const [doc, setDoc] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("penerimaan_barang").select("*").eq("id", params.id).single()
      setDoc(data)
      const it = await supabase
        .from("penerimaan_barang_items")
        .select("*, products(name)")
        .eq("penerimaan_id", params.id)
      setItems(it.data || [])
    })()
  }, [params.id])

  if (!doc) return <div className="p-6">Memuat...</div>

  return (
    <div className="p-8 bg-white text-black max-w-[794px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">PENERIMAAN BARANG</h1>
          <p>No: {doc.nomor}</p>
        </div>
        <Button onClick={() => window.print()}>Cetak</Button>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <p>
            <strong>Tanggal:</strong> {doc.tanggal?.slice(0, 10)}
          </p>
          <p>
            <strong>Gudang:</strong> {doc.warehouse_id}
          </p>
        </div>
        <div>
          <p>
            <strong>Pemasok:</strong> {doc.pemasok || "-"}
          </p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Produk</th>
            <th className="text-left py-2">Qty</th>
            <th className="text-left py-2">Satuan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{it.products?.name || it.product_id}</td>
              <td className="py-2">{it.quantity}</td>
              <td className="py-2">{it.unit || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-3 gap-6 mt-12 text-center">
        <div>
          <p>Penerima</p>
          <div className="h-16" />
          <p>(__________________)</p>
        </div>
        <div>
          <p>Pengirim</p>
          <div className="h-16" />
          <p>(__________________)</p>
        </div>
        <div>
          <p>Security</p>
          <div className="h-16" />
          <p>(__________________)</p>
        </div>
      </div>
    </div>
  )
}

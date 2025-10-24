import { supabase } from "@/lib/supabase"

export const warehouseService = {
  async list() {
    const { data, error } = await supabase.from("warehouses").select("*").order("name")
    if (error) throw error
    return data
  },
  async getWarehouses() {
    return this.list()
  },
  async create(payload: { code: string; name: string; address?: string | null }) {
    const { data, error } = await supabase.from("warehouses").insert([payload]).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, payload: Partial<{ code: string; name: string; address?: string | null }>) {
    const { data, error } = await supabase.from("warehouses").update(payload).eq("id", id).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from("warehouses").delete().eq("id", id)
    if (error) throw error
  },
}

export const storeService = {
  async list() {
    const { data, error } = await supabase.from("stores").select("*, warehouses:warehouse_id(name,code)").order("name")
    if (error) throw error
    return data
  },
  async getStores() {
    return this.list()
  },
  async create(payload: { code: string; name: string; address?: string | null; warehouse_id?: string | null }) {
    const { data, error } = await supabase.from("stores").insert([payload]).select().single()
    if (error) throw error
    return data
  },
  async update(
    id: string,
    payload: Partial<{ code: string; name: string; address?: string | null; warehouse_id?: string | null }>,
  ) {
    const { data, error } = await supabase.from("stores").update(payload).eq("id", id).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from("stores").delete().eq("id", id)
    if (error) throw error
  },
}

export const locationStockService = {
  async getProductStocksForWarehouse(warehouseId: string) {
    const { data, error } = await supabase
      .from("product_stocks")
      .select("*, products(name, sku)")
      .eq("warehouse_id", warehouseId)
      .order("updated_at", { ascending: false })
    if (error) throw error
    return data
  },
  async getProductStocksForStore(storeId: string) {
    const { data, error } = await supabase
      .from("product_stocks")
      .select("*, products(name, sku)")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false })
    if (error) throw error
    return data
  },
}

function pad(num: number, size = 4) {
  return num.toString().padStart(size, "0")
}

export const docService = {
  async generateNomor(prefix: "SJ" | "PN") {
    // format: SJ-YYYYMM-XXXX / PN-YYYYMM-XXXX
    const now = new Date()
    const ym = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}`
    const table = prefix === "SJ" ? "surat_jalan" : "penerimaan_barang"
    const { data } = await supabase
      .from(table)
      .select("nomor")
      .like("nomor", `${prefix}-${ym}-%`)
      .order("nomor", { ascending: false })
      .limit(1)
    let next = 1
    if (data?.[0]?.nomor) {
      const parts = String(data[0].nomor).split("-")
      next = Number(parts[2]) + 1
    }
    return `${prefix}-${ym}-${pad(next)}`
  },

  async listSuratJalan() {
    const { data, error } = await supabase
      .from("surat_jalan")
      .select(
        "*, dari:warehouses!surat_jalan_dari_gudang_id_fkey(name,code), ke_gudang:warehouses!surat_jalan_ke_gudang_id_fkey(name,code), ke_toko:stores(name,code)",
      )
      .order("created_at", { ascending: false })
    if (error) throw error
    return data
  },

  async createSuratJalan(payload: {
    nomor: string
    dari_gudang_id: string
    ke_gudang_id?: string | null
    ke_toko_id?: string | null
    sopir?: string | null
    nomor_kendaraan?: string | null
    tanggal: string
    dibuat_oleh: string
    items: Array<{ product_id: string; quantity: number; unit?: string | null }>
  }) {
    const { items, ...header } = payload
    const { data: sj, error } = await supabase.from("surat_jalan").insert([header]).select().single()
    if (error) throw error
    const rows = items.map((it) => ({ ...it, surat_jalan_id: sj.id }))
    const { error: itemErr } = await supabase.from("surat_jalan_items").insert(rows)
    if (itemErr) throw itemErr
    return sj
  },

  async approveSuratJalan(id: string) {
    const { data, error } = await supabase
      .from("surat_jalan")
      .update({ status: "Disetujui" })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    // Trigger DB akan melakukan sinkronisasi stok otomatis
    return data
  },

  async listPenerimaan() {
    const { data, error } = await supabase
      .from("penerimaan_barang")
      .select("*, warehouse:warehouses!penerimaan_barang_warehouse_id_fkey(name,code)")
      .order("created_at", { ascending: false })
    if (error) throw error
    return data
  },

  async createPenerimaan(payload: {
    nomor: string
    warehouse_id: string
    pemasok?: string | null
    tanggal: string
    dibuat_oleh: string
    items: Array<{ product_id: string; quantity: number; unit?: string | null }>
  }) {
    const { items, ...header } = payload
    const { data: pn, error } = await supabase.from("penerimaan_barang").insert([header]).select().single()
    if (error) throw error
    const rows = items.map((it) => ({ ...it, penerimaan_id: pn.id }))
    const { error: itemErr } = await supabase.from("penerimaan_barang_items").insert(rows)
    if (itemErr) throw itemErr
    return pn
  },

  async approvePenerimaan(id: string) {
    const { data, error } = await supabase
      .from("penerimaan_barang")
      .update({ status: "Disetujui" })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

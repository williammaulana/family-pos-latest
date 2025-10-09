import { createClient } from "@supabase/supabase-js"

// Prefer NEXT_PUBLIC_* in the browser; allow server-side SUPABASE_* fallbacks
const isBrowser = typeof window !== "undefined"
const supabaseUrl = (
  isBrowser ? process.env.NEXT_PUBLIC_SUPABASE_URL : (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)
) as string | undefined
const supabaseAnonKey = (
  isBrowser
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) as string | undefined
const supabaseServiceRoleKey = (isBrowser ? undefined : process.env.SUPABASE_SERVICE_ROLE_KEY) as string | undefined

function createSupabaseUnavailableProxy(message: string) {
  const handler: ProxyHandler<any> = {
    get() {
      return () => {
        throw new Error(message)
      }
    },
    apply() {
      throw new Error(message)
    },
  }
  return new Proxy({}, handler) as any
}

export const supabase: any =
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : createSupabaseUnavailableProxy(
        "Supabase environment variables are not set. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (and optionally SUPABASE_URL/SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY on the server).",
      )

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: "superadmin" | "admin_gudang" | "admin_toko" | "staff" | "super_admin" | "admin" | "kasir"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: "superadmin" | "admin_gudang" | "admin_toko" | "staff" | "super_admin" | "admin" | "kasir"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: "superadmin" | "admin_gudang" | "admin_toko" | "staff" | "super_admin" | "admin" | "kasir"
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string
          price: number
          stock: number
          min_stock: number
          barcode: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          price: number
          stock: number
          min_stock: number
          barcode?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          price?: number
          stock?: number
          min_stock?: number
          barcode?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          transaction_code: string
          customer_name: string | null
          customer_phone: string | null
          total_amount: number
          tax_amount: number
          payment_method: "tunai" | "kartu_debit" | "kartu_kredit" | "e_wallet"
          payment_amount: number
          change_amount: number
          status: "completed" | "cancelled"
          cashier_id: string
          created_at: string
        }
        Insert: {
          id?: string
          transaction_code: string
          customer_name?: string | null
          customer_phone?: string | null
          total_amount: number
          tax_amount: number
          payment_method: "tunai" | "kartu_debit" | "kartu_kredit" | "e_wallet"
          payment_amount: number
          change_amount: number
          status: "completed" | "cancelled"
          cashier_id: string
          created_at?: string
        }
        Update: {
          id?: string
          transaction_code?: string
          customer_name?: string | null
          customer_phone?: string | null
          total_amount?: number
          tax_amount?: number
          payment_method?: "tunai" | "kartu_debit" | "kartu_kredit" | "e_wallet"
          payment_amount?: number
          change_amount?: number
          status?: "completed" | "cancelled"
          cashier_id?: string
          created_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          created_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          warehouse_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          warehouse_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          warehouse_id?: string | null
          created_at?: string
        }
      }
      product_stocks: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string | null
          store_id: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          warehouse_id?: string | null
          store_id?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          warehouse_id?: string | null
          store_id?: string | null
          stock?: number
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string | null
          store_id: string | null
          type: "in" | "out" | "transfer"
          quantity: number
          ref_id: string | null
          ref_type: "penerimaan" | "surat_jalan" | "penyesuaian" | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          warehouse_id?: string | null
          store_id?: string | null
          type: "in" | "out" | "transfer"
          quantity: number
          ref_id?: string | null
          ref_type?: "penerimaan" | "surat_jalan" | "penyesuaian" | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          warehouse_id?: string | null
          store_id?: string | null
          type?: "in" | "out" | "transfer"
          quantity?: number
          ref_id?: string | null
          ref_type?: "penerimaan" | "surat_jalan" | "penyesuaian" | null
          created_at?: string
        }
      }
      surat_jalan: {
        Row: {
          id: string
          nomor: string
          dari_gudang_id: string
          ke_gudang_id: string | null
          ke_toko_id: string | null
          sopir: string | null
          nomor_kendaraan: string | null
          tanggal: string
          status: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh: string
          created_at: string
        }
        Insert: {
          id?: string
          nomor: string
          dari_gudang_id: string
          ke_gudang_id?: string | null
          ke_toko_id?: string | null
          sopir?: string | null
          nomor_kendaraan?: string | null
          tanggal: string
          status?: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh: string
          created_at?: string
        }
        Update: {
          id?: string
          nomor?: string
          dari_gudang_id?: string
          ke_gudang_id?: string | null
          ke_toko_id?: string | null
          sopir?: string | null
          nomor_kendaraan?: string | null
          tanggal?: string
          status?: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh?: string
          created_at?: string
        }
      }
      surat_jalan_items: {
        Row: {
          id: string
          surat_jalan_id: string
          product_id: string
          quantity: number
          unit: string | null
        }
        Insert: {
          id?: string
          surat_jalan_id: string
          product_id: string
          quantity: number
          unit?: string | null
        }
        Update: {
          id?: string
          surat_jalan_id?: string
          product_id?: string
          quantity?: number
          unit?: string | null
        }
      }
      penerimaan_barang: {
        Row: {
          id: string
          nomor: string
          warehouse_id: string
          pemasok: string | null
          tanggal: string
          status: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh: string
          created_at: string
        }
        Insert: {
          id?: string
          nomor: string
          warehouse_id: string
          pemasok?: string | null
          tanggal: string
          status?: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh: string
          created_at?: string
        }
        Update: {
          id?: string
          nomor?: string
          warehouse_id?: string
          pemasok?: string | null
          tanggal?: string
          status?: "Draft" | "Disetujui" | "Dibatalkan"
          dibuat_oleh?: string
          created_at?: string
        }
      }
      penerimaan_barang_items: {
        Row: {
          id: string
          penerimaan_id: string
          product_id: string
          quantity: number
          unit: string | null
        }
        Insert: {
          id?: string
          penerimaan_id: string
          product_id: string
          quantity: number
          unit?: string | null
        }
        Update: {
          id?: string
          penerimaan_id?: string
          product_id?: string
          quantity?: number
          unit?: string | null
        }
      }
    }
  }
}

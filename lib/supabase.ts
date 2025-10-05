import { createClient } from "@supabase/supabase-js"

// Prefer NEXT_PUBLIC_* in the browser; allow server-side SUPABASE_* fallbacks
const isBrowser = typeof window !== "undefined"
const supabaseUrl = (isBrowser
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)) as string | undefined
const supabaseAnonKey = (isBrowser
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) as string | undefined
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
          role: "super_admin" | "admin" | "kasir"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: "super_admin" | "admin" | "kasir"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: "super_admin" | "admin" | "kasir"
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
    }
  }
}

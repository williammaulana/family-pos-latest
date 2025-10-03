import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

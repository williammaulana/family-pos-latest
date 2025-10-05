import { testConnection } from "./mysql"

type Provider = "mysql" | "supabase"

let cachedProvider: Provider | null = null

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)) as Promise<T>,
  ])
}

function isNetworkOrTimeoutError(error: unknown): boolean {
  const err = error as any
  const message = err?.message ? String(err.message).toLowerCase() : ""
  const causeCode = err?.cause?.code
  return (
    message.includes("fetch failed") ||
    message.includes("network error") ||
    message.includes("timeout") ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ENOTFOUND" ||
    causeCode === "ETIMEDOUT" ||
    causeCode === "ECONNRESET"
  )
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  timeoutMs = 5000,
): Promise<T> {
  try {
    return await withTimeout(primary(), timeoutMs)
  } catch (error) {
    if (isNetworkOrTimeoutError(error)) {
      try {
        return await fallback()
      } catch (_) {
        // swallow and rethrow original below
      }
    }
    throw error
  }
}

export async function resolveProvider(): Promise<Provider> {
  if (cachedProvider) return cachedProvider

  const isProduction = process.env.NODE_ENV === "production"

  if (isProduction) {
    try {
      const result = await withTimeout(testConnection(), 3000)
      if (result && (result as any).success) {
        cachedProvider = "mysql"
        return cachedProvider
      }
    } catch (_) {
      // ignore and fallback to Supabase
    }

    const hasSupabase =
      !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!hasSupabase) {
      throw new Error(
        "MySQL tidak tersedia dan kredensial Supabase tidak diset. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY (atau SUPABASE_URL/SUPABASE_ANON_KEY)."
      )
    }
    cachedProvider = "supabase"
    return cachedProvider
  }

  // Non-production: default ke MySQL jika bisa, kalau gagal baru Supabase bila tersedia
  try {
    const result = await withTimeout(testConnection(), 2000)
    if (result && (result as any).success) {
      cachedProvider = "mysql"
      return cachedProvider
    }
  } catch (_) {
    // ignore
  }
  const hasSupabase =
    !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (hasSupabase) {
    cachedProvider = "supabase"
    return cachedProvider
  }
  cachedProvider = "mysql"
  return cachedProvider
}

export async function getServices() {
  const provider = await resolveProvider()

  if (provider === "mysql") {
    return await import("./mysql-service")
  }

  const supabaseServices = await import("./supabase-service")

  // Adapter kecil untuk method yang tidak ada di Supabase service
  const productService = {
    ...supabaseServices.productService,
    async adjustStock(productId: string, quantityChange: number, reason: string) {
      // Fallback: update stock langsung; catat history jika tabel tersedia
      const product = await supabaseServices.productService.getProductById(productId as any)
      if (!product) throw new Error("Product not found")
      const newStock = (product as any).stock + quantityChange
      await supabaseServices.productService.updateStock(productId as any, newStock)
      try {
        const { supabase } = await import("./supabase")
        await supabase
          .from("stock_history")
          .insert([{ product_id: productId, quantity_change: quantityChange, reason }])
      } catch (_) {
        // Biarkan lewat jika tabel tidak ada atau gagal insert history
      }
    },
    async getLowStockProducts() {
      return await withFallback(
        () => supabaseServices.productService.getLowStockProducts(),
        async () => {
          const mysql = await import("./mysql-service")
          return await mysql.productService.getLowStockProducts()
        },
      )
    },
    async getStockHistory() {
      try {
        const { supabase } = await import("./supabase")
        const { data, error } = await supabase
          .from("stock_history")
          .select("*, products(name)")
          .order("created_at", { ascending: false })
        if (error) throw error
        return (data || []).map((history: any) => ({
          ...history,
          productName: history.products?.name || "Unknown",
        }))
      } catch (_) {
        return []
      }
    },
  }

  const transactionService = {
    ...supabaseServices.transactionService,
    async getTransactions(limit?: number) {
      return await withFallback(
        () => supabaseServices.transactionService.getTransactions(limit),
        async () => {
          const mysql = await import("./mysql-service")
          return await mysql.transactionService.getTransactions(limit)
        },
      )
    },
  }

  return {
    ...supabaseServices,
    productService,
    transactionService,
  }
}

export async function getProvider(): Promise<Provider> {
  return await resolveProvider()
}



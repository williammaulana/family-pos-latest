type Provider = "supabase"

let cachedProvider: Provider | null = null

export async function resolveProvider(): Promise<Provider> {
  // Force Supabase as the only provider
  if (!cachedProvider) cachedProvider = "supabase"
  return cachedProvider
}

export async function getServices() {
  const supabaseServices = await import("./supabase-service")
  const locationServices = await import("./locations-service")

  // Adapter kecil untuk method yang tidak ada di Supabase service
  const productService = {
    ...supabaseServices.productService,
    async adjustStock(productId: string, quantityChange: number, reason: string) {
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
        // ignore
      }
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

  return {
    ...supabaseServices,
    ...locationServices,
    productService,
  }
}

export async function getProvider(): Promise<Provider> {
  return await resolveProvider()
}

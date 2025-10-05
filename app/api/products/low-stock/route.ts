import { NextRequest, NextResponse } from "next/server"
import { productService } from "@/lib/supabase-service"

export async function GET(request: NextRequest) {
  try {
    const products = await productService.getLowStockProducts()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error("Error fetching low stock products:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch low stock products" }, { status: 500 })
  }
}

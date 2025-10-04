import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(request: NextRequest) {
  try {
    const { productService } = await getServices()
    const history = await productService.getStockHistory()

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error("Error fetching stock history:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stock history",
      },
      { status: 500 }
    )
  }
}

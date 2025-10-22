import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(request: NextRequest) {
  try {
    const { warehouseService, storeService } = await getServices()

    const [warehouses, stores] = await Promise.all([
      warehouseService.getWarehouses(),
      storeService.getStores()
    ])

    // Combine warehouses and stores into a single locations array
    const locations = [
      ...warehouses.map(w => ({ ...w, type: 'warehouse' })),
      ...stores.map(s => ({ ...s, type: 'store' }))
    ]

    return NextResponse.json({
      success: true,
      data: locations,
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch locations",
      },
      { status: 500 }
    )
  }
}

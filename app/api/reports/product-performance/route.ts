import { NextRequest, NextResponse } from "next/server"
import { reportsService } from "@/lib/mysql-service"

export async function GET(request: NextRequest) {
  try {
    const data = await reportsService.getProductPerformance()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching product performance:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch product performance" }, { status: 500 })
  }
}

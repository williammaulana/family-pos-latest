import { NextRequest, NextResponse } from "next/server"
import { reportsService } from "@/lib/mysql-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")
    const data = await reportsService.getSalesReports(days)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching sales reports:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch sales reports" }, { status: 500 })
  }
}

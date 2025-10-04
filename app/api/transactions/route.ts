import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam) : undefined
    const { transactionService } = await getServices()
    const data = await transactionService.getTransactions(limit)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
  }
}

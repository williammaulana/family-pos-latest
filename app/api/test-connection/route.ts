import { NextResponse } from "next/server"
import { testConnection } from "@/lib/mysql"

export async function GET() {
  try {
    const result = await testConnection()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      config: result.config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[POS] Test connection API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test koneksi gagal",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

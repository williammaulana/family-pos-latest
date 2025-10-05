import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase.from("users").select("id").limit(1)
    if (error) {
      return NextResponse.json({
        success: false,
        message: "Supabase query failed",
        error: error.message,
        hasEnv: { url: hasUrl, key: hasKey },
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      message: "Supabase connection OK",
      hasEnv: { url: hasUrl, key: hasKey },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[POS] Supabase health API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test koneksi Supabase gagal",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

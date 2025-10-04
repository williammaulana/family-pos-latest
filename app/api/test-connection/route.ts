import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1)
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase query failed",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
    const urlStr = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
    let host = ""
    try {
      host = urlStr ? new URL(urlStr).host : ""
    } catch (_) {
      host = urlStr
    }
    return NextResponse.json({
      success: true,
      message: "Supabase connection OK",
      config: {
        host,
        port: 443,
        database: "supabase",
        user: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) ? "anon" : "",
        ssl: true,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[POS] Test connection API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test koneksi Supabase gagal",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

    const { error } = await supabase.from("users").select("id").limit(1)

    return NextResponse.json({
      success: hasUrl && hasKey && !error,
      message: hasUrl && hasKey ? (error ? `Supabase reachable but query failed: ${error.message}` : "Supabase connection OK") : "Supabase env vars missing",
      config: {
        hasUrl,
        hasKey,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[POS] Test connection API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Supabase health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

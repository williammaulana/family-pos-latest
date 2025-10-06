import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getErrorMessage } from "@/lib/utils"

export async function GET() {
  try {
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

    const { error } = await supabase.from("users").select("id").limit(1)
    if (error) {
      return NextResponse.json(
        { ok: false, hasEnv: { url: hasUrl, key: hasKey }, error: getErrorMessage(error, "Supabase error") },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, hasEnv: { url: hasUrl, key: hasKey } })
  } catch (e) {
    const message = getErrorMessage(e, "Unknown error")
    return NextResponse.json({ ok: false, error: message || "Unknown error" }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
// Deprecated MySQL migration endpoints; keep for backward compatibility returning empty state

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "MySQL migration endpoint deprecated; use Supabase SQL migrations.",
      migrations: [],
    })
  } catch (error) {
    console.error("[v0] Migration API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Migration not supported (deprecated)",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      migrations: [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check migration status",
      },
      { status: 500 },
    )
  }
}

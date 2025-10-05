import { NextResponse } from "next/server"
import { initializeDatabase, checkMigrationStatus } from "@/lib/migration"

function isProduction() {
  return process.env.NODE_ENV === "production"
}

function authorize(request: Request): { ok: boolean; message?: string } {
  // In production, require a header token or disallow entirely unless explicitly enabled
  if (!isProduction()) return { ok: true }

  const enabled = process.env.ENABLE_MIGRATION_ENDPOINT === "true"
  if (!enabled) {
    return { ok: false, message: "Migration endpoint disabled in production" }
  }

  const expected = process.env.MIGRATION_TOKEN
  if (!expected) {
    return { ok: false, message: "Migration token not configured" }
  }

  const provided = request.headers.get("x-migration-token") || request.headers.get("authorization")?.replace("Bearer ", "")
  if (provided !== expected) {
    return { ok: false, message: "Unauthorized" }
  }

  return { ok: true }
}

export async function POST(request: Request) {
  const auth = authorize(request)
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message || "Unauthorized" }, { status: 401 })
  }
  try {
    await initializeDatabase()
    const migrations = await checkMigrationStatus()

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
      migrations,
    })
  } catch (error) {
    console.error("[v0] Migration API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const auth = authorize(request)
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message || "Unauthorized" }, { status: 401 })
  }
  try {
    const migrations = await checkMigrationStatus()

    return NextResponse.json({
      success: true,
      migrations,
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

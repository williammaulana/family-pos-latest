import { NextResponse } from "next/server"
import { initializeDatabase, checkMigrationStatus } from "@/lib/migration"

export async function POST() {
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

export async function GET() {
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

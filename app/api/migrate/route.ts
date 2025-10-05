import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  // Supabase migrations should be applied via the Supabase SQL editor or CLI
  return NextResponse.json({
    success: false,
    error: "Apply migrations via Supabase SQL editor or CLI.",
  }, { status: 400 })
}

export async function GET() {
  try {
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations")
    const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : []
    const migrations = files
      .filter((f) => /\d+_.+\.sql$/i.test(f))
      .map((filename) => {
        const idStr = filename.split("_")[0]
        const id = Number.parseInt(idStr, 10)
        return {
          id: Number.isNaN(id) ? 0 : id,
          name: filename,
          executed_at: new Date(0).toISOString(),
        }
      })
      .sort((a, b) => a.id - b.id)

    return NextResponse.json({ success: true, migrations })
  } catch (error) {
    return NextResponse.json({ success: false, migrations: [] }, { status: 500 })
  }
}

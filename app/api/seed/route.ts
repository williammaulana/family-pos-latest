import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/migration"

export async function POST() {
  try {
    await initializeDatabase()
    const { executeQuery } = await import("@/lib/mysql")

    // Ensure password_hash column exists before seeding
    const colCheck = (await executeQuery(
      "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'"
    )) as any[]
    const hasPasswordHash = Array.isArray(colCheck) && colCheck.length > 0 && (colCheck[0].cnt ?? 0) > 0

    if (!hasPasswordHash) {
      await executeQuery("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL")
    }

    const defaultHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

    // Insert demo users with default password if they don't exist
    await executeQuery(
      "INSERT IGNORE INTO users (id, email, name, role, password_hash) VALUES (UUID(), 'superadmin@familystore.com', 'Super Admin', 'super_admin', ?)",
      [defaultHash]
    )
    await executeQuery(
      "INSERT IGNORE INTO users (id, email, name, role, password_hash) VALUES (UUID(), 'admin@familystore.com', 'Admin Store', 'admin', ?)",
      [defaultHash]
    )
    await executeQuery(
      "INSERT IGNORE INTO users (id, email, name, role, password_hash) VALUES (UUID(), 'kasir1@familystore.com', 'Kasir Satu', 'kasir', ?)",
      [defaultHash]
    )
    await executeQuery(
      "INSERT IGNORE INTO users (id, email, name, role, password_hash) VALUES (UUID(), 'kasir2@familystore.com', 'Kasir Dua', 'kasir', ?)",
      [defaultHash]
    )

    // Backfill existing users missing a password
    await executeQuery(
      "UPDATE users SET password_hash = ? WHERE password_hash IS NULL",
      [defaultHash]
    )

    return NextResponse.json({ success: true, message: "Seed completed. Default password for all demo users is 'password'" })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/mysql-service'
import bcrypt from 'bcryptjs'
import { getErrorMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Ensure DB is migrated and column exists
    await initializeDatabase()

    // Fetch user by email (handle older schema without password_hash)
    const { executeQuery } = await import('@/lib/mysql')

    // Check if users.password_hash column exists to avoid ER_BAD_FIELD_ERROR
    const colCheck = (await executeQuery(
      "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'"
    )) as any[]
    const hasPasswordHash = Array.isArray(colCheck) && colCheck.length > 0 && (colCheck[0].cnt ?? 0) > 0

    const results = (await executeQuery(
      hasPasswordHash
        ? 'SELECT id, email, name, role, password_hash FROM users WHERE email = ?'
        : 'SELECT id, email, name, role FROM users WHERE email = ?',
      [email]
    )) as any[]

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = results[0]

    // Fallback: accept default demo password if hash missing or column absent
    const storedHash = (user as any).password_hash || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    const isValidPassword = await bcrypt.compare(password, storedHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    const message = getErrorMessage(error, 'Internal server error')
    const lower = message.toLowerCase()
    const isDbUnavailable =
      lower.includes('econnrefused') ||
      lower.includes('tidak dapat terhubung ke mysql') ||
      lower.includes('timeout')
    return NextResponse.json({ error: message || 'Internal server error' }, { status: isDbUnavailable ? 503 : 500 })
  }
}

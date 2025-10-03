import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/mysql-service'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initializeDatabase()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Fetch user by email
    const { executeQuery } = await import('@/lib/mysql')
    const results = await executeQuery('SELECT id, email, name, role, password_hash FROM users WHERE email = ?', [email]) as any[]

    if (results.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = results[0]

    // Fallback: accept default demo password if hash missing (post-migration should set it)
    const storedHash = user.password_hash || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    const isValidPassword = await bcrypt.compare(password, storedHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Return user data (exclude sensitive info if any)
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

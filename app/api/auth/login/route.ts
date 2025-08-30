import { NextRequest, NextResponse } from 'next/server'
import { userService, initializeDatabase } from '@/lib/mysql-service'

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initializeDatabase()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Fetch user by email
    // Since userService doesn't have getUserByEmail, we'll query directly
    const { executeQuery } = await import('@/lib/mysql')
    const results = await executeQuery('SELECT * FROM users WHERE email = ?', [email]) as any[]

    if (results.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = results[0]

    // Check password (keeping the mock logic)
    if (password !== 'password123') {
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

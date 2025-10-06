import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Fetch user by email from Supabase
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .single()

    if (error || !userRow) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = userRow
    const storedHash = user.password_hash || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    // Normalize PHP's $2y$ prefix to $2a$ for broad bcrypt compatibility
    const normalizedHash = storedHash.startsWith('$2y$')
      ? '$2a$' + storedHash.slice(4)
      : storedHash
    const isValidPassword = await bcrypt.compare(password, normalizedHash)
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
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

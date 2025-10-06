import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSessionToken, buildSessionCookie } from '@/lib/session'

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
    const isValidPassword = await bcrypt.compare(password, storedHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createSessionToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    res.headers.set('Set-Cookie', buildSessionCookie(token))
    return res
  } catch (error) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

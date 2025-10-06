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

    // Fetch basic user columns first (compatible with older schemas without password_hash)
    const { data: basicUser, error: basicError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single()

    if (basicError || !basicUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Try to fetch password_hash; if column missing or null, fallback to default "password"
    let storedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    try {
      const { data: pwdRow } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', basicUser.id)
        .single()
      if (pwdRow?.password_hash) {
        storedHash = pwdRow.password_hash
      }
    } catch {
      // Ignore; keep default hash
    }
    const isValidPassword = await bcrypt.compare(password, storedHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createSessionToken({
      sub: basicUser.id,
      name: basicUser.name,
      email: basicUser.email,
      role: basicUser.role,
    })

    const res = NextResponse.json({
      user: {
        id: basicUser.id,
        name: basicUser.name,
        email: basicUser.email,
        role: basicUser.role,
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

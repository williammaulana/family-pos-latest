import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Normalize input
    const normalizedEmail = String(email).trim().toLowerCase()

    // Fetch user by email from Supabase
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', normalizedEmail)
      .single()

    if (error || !userRow) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = userRow

    // Support bcrypt hash variants like $2y$ (common from PHP)
    const rawHash = user.password_hash
    const normalizedHash = rawHash && rawHash.startsWith('$2y$')
      ? ('$2a$' + rawHash.slice(4))
      : rawHash

    if (!normalizedHash) {
      return NextResponse.json({ error: 'User has no password set' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(String(password), normalizedHash)
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

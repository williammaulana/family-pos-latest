import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, name, role, password_hash,
        warehouse_id, store_id,
        warehouses(name),
        stores(name)
      `)
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!userRow) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const storedHash = userRow.password_hash || '$2a$10$xzmaZeeiEwXz6AjMQqqj2uiGp3DJcvItalqqJXy2mY8jMBS9O/Vp6'
    const isValidPassword = await bcrypt.compare(password, storedHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        warehouseId: userRow.warehouse_id,
        storeId: userRow.store_id,
        locationName: userRow.warehouses?.name || userRow.stores?.name || "Tidak ada lokasi"
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

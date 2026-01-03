import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"
import { getCurrentUser, isSuperAdmin, canCreateUser } from "@/lib/auth-middleware"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const { userService } = await getServices()
    const users = await userService.getUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, ...rest } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Use service role key for user creation to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    const payload: any = { ...rest }
    payload.password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([{
        name: payload.name,
        email: payload.email,
        role: payload.role,
        warehouse_id: payload.warehouseId,
        store_id: payload.storeId,
        password_hash: payload.password_hash,
      }])
      .select(`
        *,
        warehouses:warehouse_id(name),
        stores:store_id(name)
      `)
      .single()

    if (error) throw error

    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      warehouseId: data.warehouse_id,
      storeId: data.store_id,
      locationName: data.warehouses?.name || data.stores?.name || null,
      passwordHash: data.password_hash,
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can update users' }, { status: 403 })
    }

    const { id, password, ...rest } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })

    const { userService } = await getServices()
    const updates: any = { ...rest }

    // If password is being updated, we need to update it in Supabase Auth
    if (password) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        })

        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password
        })

        if (passwordError) {
          console.error('Password update error:', passwordError)
          return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }
      }
    }

    const user = await userService.updateUser(id, updates)
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can delete users' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    const { userService } = await getServices()
    await userService.deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}

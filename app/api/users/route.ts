import { NextRequest, NextResponse } from "next/server"
import { getServices, getProvider } from "@/lib/service-resolver"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"

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
    const provider = await getProvider()
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...rest, password_hash: hash }])
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
    const { userService } = await getServices()
    const user = await userService.createUser(rest)
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, password, ...rest } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    const provider = await getProvider()
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      const { data, error } = await supabase
        .from('users')
        .update({ password_hash: hash, updated_at: new Date().toISOString(), ...rest })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
    const { userService } = await getServices()
    const user = await userService.updateUser(id, rest)
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

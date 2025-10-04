import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"
import bcrypt from "bcryptjs"

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
    const { userService } = await getServices()
    // If password provided, hash it into payload for Supabase table
    const payload = { ...rest }
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      ;(payload as any).password_hash = hash
    }
    const user = await userService.createUser(payload)
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, password, ...rest } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    const { userService } = await getServices()
    const payload: any = { ...rest }
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      payload.password_hash = hash
    }
    const user = await userService.updateUser(id, payload)
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

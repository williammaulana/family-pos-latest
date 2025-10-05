import { NextRequest, NextResponse } from "next/server"
import { getServices, getProvider } from "@/lib/service-resolver"
import bcrypt from "bcryptjs"
import { executeQuery } from "@/lib/mysql"

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
    const { password, password_hash, passwordHash, ...rest } = body
    const provider = await getProvider()
    if (provider === "mysql") {
      // Support either plaintext password or pre-hashed password
      let hash: string | null = null
      if (password_hash || passwordHash) {
        const prehashed = (password_hash || passwordHash) as string
        // Normalize $2y$ (Laravel/PHP) to $2a$ for bcryptjs compatibility
        hash = prehashed.startsWith("$2y$") ? "$2a$" + prehashed.slice(4) : prehashed
      } else if (password) {
        hash = await bcrypt.hash(password, 10)
      }

      await executeQuery(
        "INSERT INTO users (id, email, name, role, password_hash) VALUES (UUID(), ?, ?, ?, ?)",
        [rest.email, rest.name, rest.role, hash]
      )
      const users = (await executeQuery("SELECT * FROM users WHERE email = ?", [rest.email])) as any[]
      return NextResponse.json({ success: true, data: users[0] })
    } else {
      const { userService } = await getServices()
      const user = await userService.createUser(rest)
      return NextResponse.json({ success: true, data: user })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, password, password_hash, passwordHash, ...rest } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    const provider = await getProvider()
    if (provider === "mysql") {
      if (password || password_hash || passwordHash) {
        let hash: string
        if (password_hash || passwordHash) {
          const prehashed = (password_hash || passwordHash) as string
          hash = prehashed.startsWith("$2y$") ? "$2a$" + prehashed.slice(4) : prehashed
        } else {
          hash = await bcrypt.hash(password as string, 10)
        }
        await executeQuery("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [hash, id])
      }
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

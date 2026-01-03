import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "superadmin" | "admin_gudang" | "admin_toko" | "staff" | "super_admin" | "admin" | "kasir"
  warehouseId?: string
  storeId?: string
  locationName?: string
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    // Fetch user data from our users table
    const { data: userData } = await supabase
      .from('users')
      .select(`
        id, email, name, role,
        warehouse_id, store_id,
        warehouses(name),
        stores(name)
      `)
      .eq('id', user.id)
      .single()

    if (!userData) {
      return null
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      warehouseId: userData.warehouse_id,
      storeId: userData.store_id,
      locationName: userData.warehouses?.name || userData.stores?.name || "Tidak ada lokasi"
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export function requireRole(allowedRoles: string[]) {
  return async function middleware(request: NextRequest) {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Add user to request for use in the API route
    ;(request as any).user = user

    return null // Continue to the API route
  }
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'superadmin' || user?.role === 'super_admin'
}

export function canCreateUser(currentUser: AuthUser | null, targetRole?: string): boolean {
  if (!currentUser) return false

  // Only superadmin can create users
  if (!isSuperAdmin(currentUser)) return false

  // Superadmin can create any role
  return true
}

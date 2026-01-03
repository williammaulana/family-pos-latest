"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("pos_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user data from our users table
        const { data: userData } = await supabase
          .from('users')
          .select(`
            id, email, name, role,
            warehouse_id, store_id,
            warehouses(name),
            stores(name)
          `)
          .eq('id', session.user.id)
          .single()

        if (userData) {
          const userObj = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            warehouseId: userData.warehouse_id,
            storeId: userData.store_id,
            locationName: userData.warehouses?.name || userData.stores?.name || "Tidak ada lokasi"
          }
          setUser(userObj)
          localStorage.setItem("pos_user", JSON.stringify(userObj))
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem("pos_user")
      }
    })

    setIsLoading(false)

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Login error:', data.error)
        setIsLoading(false)
        return false
      }

      if (data.user) {
        // Set user data directly since we're not using Supabase auth
        const userObj = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          warehouseId: data.user.warehouseId,
          storeId: data.user.storeId,
          locationName: data.user.locationName
        }
        setUser(userObj)
        localStorage.setItem("pos_user", JSON.stringify(userObj))
        setIsLoading(false)
        return true
      } else {
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem("pos_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

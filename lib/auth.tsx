"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/types"

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
    // Check for stored user session. If missing, try fetching from server cookie.
    const storedUser = localStorage.getItem("pos_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsLoading(false)
      return
    }

    const fetchFromCookie = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          if (data?.user) {
            setUser(data.user)
            localStorage.setItem("pos_user", JSON.stringify(data.user))
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFromCookie()
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

      if (!response.ok) {
        setIsLoading(false)
        return false
      }

      const data = await response.json()
      if (data.user) {
        setUser(data.user)
        localStorage.setItem("pos_user", JSON.stringify(data.user))
        setIsLoading(false)
        return true
      } else {
        setIsLoading(false)
        return false
      }
    } catch (error) {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pos_user")
    try {
      // Fire-and-forget; we do not need to await
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    } catch {
      // ignore
    }
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

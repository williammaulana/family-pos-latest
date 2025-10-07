"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { Store } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const success = await login(email, password)
    if (!success) {
      setError("Email atau password salah")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Family Store</CardTitle>
          <CardDescription>Masuk ke sistem POS & Inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masukkan email anda"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="masukkan password anda"
                required
              />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Demo Akun:</p>
            <p>Super Admin: superadmin@familystore.com</p>
            <p>Admin: admin@familystore.com</p>
            <p>Kasir: kasir@familystore.com</p>
            <p className="text-xs mt-1">Password: password123</p>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <div className="mt-2 text-center">
            <Link href="/university" className="text-sm text-primary hover:underline">
              Lihat situs universitas
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

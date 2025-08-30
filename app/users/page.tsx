"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserTable } from "@/components/users/user-table"
import { UserForm } from "@/components/users/user-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Users, Shield, UserCheck } from "lucide-react"
import type { User } from "@/types"

// Mock users data (expanded from auth.tsx)
const mockUsers: User[] = [
  {
    id: "1",
    name: "Super Admin",
    email: "superadmin@familystore.com",
    role: "super_admin",
  },
  {
    id: "2",
    name: "Admin Store",
    email: "admin@familystore.com",
    role: "admin",
  },
  {
    id: "3",
    name: "Kasir 1",
    email: "kasir@familystore.com",
    role: "kasir",
  },
  {
    id: "4",
    name: "Kasir 2",
    email: "kasir2@familystore.com",
    role: "kasir",
  },
]

export default function UsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
    if (!isLoading && user && user.role !== "super_admin") {
      router.push("/dashboard")
      toast({
        title: "Akses Ditolak",
        description: "Hanya Super Admin yang dapat mengakses manajemen pengguna",
        variant: "destructive",
      })
    }
  }, [user, isLoading, router, toast])

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsUserFormOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return

    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Pengguna dihapus",
        description: "Pengguna berhasil dihapus dari sistem",
      })
    } catch (error) {
      toast({
        title: "Gagal menghapus pengguna",
        description: "Terjadi kesalahan saat menghapus pengguna",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({
        title: selectedUser ? "Pengguna diperbarui" : "Pengguna ditambahkan",
        description: selectedUser
          ? "Informasi pengguna berhasil diperbarui"
          : "Pengguna baru berhasil ditambahkan ke sistem",
      })
      setIsUserFormOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast({
        title: "Gagal menyimpan pengguna",
        description: "Terjadi kesalahan saat menyimpan pengguna",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "super_admin") {
    return null
  }

  const totalUsers = mockUsers.length
  const adminCount = mockUsers.filter((u) => u.role === "admin" || u.role === "super_admin").length
  const cashierCount = mockUsers.filter((u) => u.role === "kasir").length

  return (
    <DashboardLayout title="Manajemen Pengguna">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{adminCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kasir</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{cashierCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
            <p className="text-sm text-muted-foreground">Kelola pengguna dan hak akses sistem</p>
          </div>
          <Button onClick={() => setIsUserFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>

        {/* User Table */}
        <UserTable users={mockUsers} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />

        {/* User Form Dialog */}
        <UserForm
          user={selectedUser}
          isOpen={isUserFormOpen}
          onClose={() => {
            setIsUserFormOpen(false)
            setSelectedUser(null)
          }}
          onSave={handleSaveUser}
          isLoading={isProcessing}
        />
      </div>
    </DashboardLayout>
  )
}

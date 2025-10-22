"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types"
import { warehouseService, storeService } from "@/lib/locations-service"

interface UserFormProps {
  user?: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<User>) => void
  isLoading?: boolean
}

export function UserForm({ user, isOpen, onClose, onSave, isLoading }: UserFormProps) {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff" as User["role"],
    password: "",
    confirmPassword: "",
    locationType: "warehouse" as "warehouse" | "store",
    locationId: "",
  })

  useEffect(() => {
    ;(async () => {
      const [ws, ss] = await Promise.all([warehouseService.list(), storeService.list()])
      setWarehouses(ws || [])
      setStores(ss || [])
    })()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
        confirmPassword: "",
        locationType: user.warehouseId ? "warehouse" : "store",
        locationId: user.warehouseId || user.storeId || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "staff",
        password: "",
        confirmPassword: "",
        locationType: "warehouse",
        locationId: "",
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && formData.password !== formData.confirmPassword) {
      alert("Password tidak cocok!")
      return
    }

    const userData: Partial<User> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    }

    // Add location fields
    if (formData.locationType === "warehouse") {
      userData.warehouseId = formData.locationId || undefined
      userData.storeId = undefined
    } else {
      userData.storeId = formData.locationId || undefined
      userData.warehouseId = undefined
    }

    if (user) {
      userData.id = user.id
    }

    onSave(userData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
          <DialogDescription>
            {user ? "Ubah informasi pengguna di bawah ini." : "Masukkan informasi pengguna baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="masukkan@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin_toko">Admin Toko</SelectItem>
                <SelectItem value="admin_gudang">Admin Gudang</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationType">Lokasi</Label>
            <Select
              value={formData.locationType}
              onValueChange={(value: "warehouse" | "store") => handleInputChange("locationType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">Gudang</SelectItem>
                <SelectItem value="store">Toko</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationId">Pilih {formData.locationType === "warehouse" ? "Gudang" : "Toko"}</Label>
            <Select value={formData.locationId} onValueChange={(value) => handleInputChange("locationId", value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${formData.locationType === "warehouse" ? "gudang" : "toko"}`} />
              </SelectTrigger>
              <SelectContent>
                {(formData.locationType === "warehouse" ? warehouses : stores).map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Konfirmasi password"
                  required
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : user ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

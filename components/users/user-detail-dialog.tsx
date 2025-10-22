"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types"

interface UserDetailDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export default function UserDetailDialog({ user, isOpen, onClose }: UserDetailDialogProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
      case "superadmin":
        return <Badge variant="default">Super Admin</Badge>
      case "admin":
      case "admin_gudang":
      case "admin_toko":
        return <Badge variant="secondary">Admin</Badge>
      case "kasir":
      case "staff":
        return <Badge variant="outline">Staff</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Detail Pengguna</DialogTitle>
          <DialogDescription>Informasi lengkap pengguna</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Nama</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="mt-1">{getRoleBadge(user.role)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Lokasi</div>
              <div className="font-medium">{(user as any).locationName || "Tidak ada lokasi"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID Pengguna</div>
              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.id}</div>
            </div>
            {user.avatar && (
              <div>
                <div className="text-xs text-muted-foreground">Avatar</div>
                <div className="mt-1">
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

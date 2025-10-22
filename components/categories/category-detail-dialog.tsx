"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface CategoryDetailDialogProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
}

export function CategoryDetailDialog({
  category,
  isOpen,
  onClose,
}: CategoryDetailDialogProps) {
  if (!category) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isRecentlyUpdated = category.updatedAt !== category.createdAt

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Kategori
            <Badge variant="secondary">{category.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang kategori ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Informasi Dasar
              </h3>
              <Separator className="mt-2" />
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nama Kategori
                </label>
                <p className="mt-1 text-sm text-gray-900">{category.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {category.description || "Tidak ada deskripsi"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Informasi Waktu
              </h3>
              <Separator className="mt-2" />
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Dibuat Pada
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(category.createdAt)}
                </p>
              </div>

              {isRecentlyUpdated && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Terakhir Diubah
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(category.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Informasi Tambahan
              </h3>
              <Separator className="mt-2" />
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID Kategori
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {category.id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant="default">Aktif</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

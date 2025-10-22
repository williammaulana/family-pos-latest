"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CategoryTable } from "@/components/categories/category-table"
import { CategoryForm } from "@/components/categories/category-form"
import { CategoryDetailDialog } from "@/components/categories/category-detail-dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }

    fetchCategories()
  }, [user, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async (categoryData: { name: string; description?: string }) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        await fetchCategories()
        setIsFormOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      alert("Failed to create category")
    }
  }

  const handleUpdateCategory = async (categoryData: { name: string; description?: string }) => {
    if (!editingCategory) return

    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCategory.id,
          ...categoryData,
        }),
      })

      if (response.ok) {
        await fetchCategories()
        setIsFormOpen(false)
        setEditingCategory(null)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Error updating category:", error)
      alert("Failed to update category")
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleViewDetail = (category: Category) => {
    setSelectedCategory(category)
    setIsDetailOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingCategory(null)
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Manajemen Kategori">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Manajemen Kategori">
      <div className="flex flex-col h-full space-y-6">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <p className="text-gray-600">Kelola kategori produk dalam sistem</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </Button>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-lg shadow">
          <CategoryTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDeleteCategory}
            onViewDetail={handleViewDetail}
          />
        </div>
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
        isLoading={false}
      />

      <CategoryDetailDialog
        category={selectedCategory}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedCategory(null)
        }}
      />
    </DashboardLayout>
  )
}

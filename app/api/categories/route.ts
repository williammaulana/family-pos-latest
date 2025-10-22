import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(_request: NextRequest) {
  try {
    const { categoryService } = await getServices()
    const categories = await categoryService.getCategories()
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()
    if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    const { categoryService } = await getServices()
    const created = await categoryService.createCategory(name, description)
    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 })
    if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    const { categoryService } = await getServices()
    const updated = await categoryService.updateCategory(id, name, description)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 })
    const { categoryService } = await getServices()
    await categoryService.deleteCategory(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 })
  }
}

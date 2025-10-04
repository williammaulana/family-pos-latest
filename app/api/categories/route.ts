import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(request: NextRequest) {
  try {
    const { categoryService } = await getServices()
    const categories = await categoryService.getCategories()

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
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

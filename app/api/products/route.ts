import { NextRequest, NextResponse } from "next/server"
import { productService } from "@/lib/supabase-service"

export async function GET(request: NextRequest) {
  try {
    const products = await productService.getProducts()

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload: any = {
      ...body,
      // Map camelCase to snake_case for DB layer
      min_stock: body.min_stock ?? body.minStock,
      cost_price: body.cost_price ?? body.costPrice,
      image_url: body.image_url ?? body.imageUrl,
    }
    delete payload.minStock
    delete payload.costPrice
    delete payload.imageUrl
    const product = await productService.createProduct(payload)
    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    const updates: any = {
      ...rest,
    }
    if (rest.minStock !== undefined) {
      updates.min_stock = rest.minStock
      delete updates.minStock
    }
    if (rest.costPrice !== undefined) {
      updates.cost_price = rest.costPrice
      delete updates.costPrice
    }
    if (rest.imageUrl !== undefined) {
      updates.image_url = rest.imageUrl
      delete updates.imageUrl
    }
    const updated = await productService.updateProduct(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    await productService.deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}

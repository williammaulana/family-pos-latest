import { NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const storeId = searchParams.get('storeId')

    const { productService } = await getServices()
    const products = await productService.getProducts(warehouseId || undefined, storeId || undefined)

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

    // Handle location-based stock creation
    if (body.locationType && body.locationId) {
      const { productService } = await getServices()
      const product = await productService.createProductWithLocation(payload, body.locationType, body.locationId)
      return NextResponse.json({ success: true, data: product })
    } else {
      const { productService } = await getServices()
      const product = await productService.createProduct(payload)
      return NextResponse.json({ success: true, data: product })
    }
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, locationType, locationId, ...rest } = body
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

    const { productService } = await getServices()

    // Handle location update for superadmin
    if (locationType && locationId) {
      // First update the product
      const updated = await productService.updateProduct(id, updates)

      // Then update the location by moving stock
      await productService.updateProductLocation(id, locationType, locationId)

      return NextResponse.json({ success: true, data: updated })
    } else {
      const updated = await productService.updateProduct(id, updates)
      return NextResponse.json({ success: true, data: updated })
    }
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
    const { productService } = await getServices()
    await productService.deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}

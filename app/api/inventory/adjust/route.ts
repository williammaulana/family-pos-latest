'use server'
import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/mysql-service'
import { z } from 'zod'

const adjustmentSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  reason: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity, reason } = adjustmentSchema.parse(body)

    await productService.adjustStock(productId, quantity, reason)

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to adjust stock',
      },
      { status: 500 }
    )
  }
}

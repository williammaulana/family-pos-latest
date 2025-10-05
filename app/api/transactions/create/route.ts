import { NextResponse } from "next/server"
import { getServices } from "@/lib/service-resolver"

export async function POST(request: Request) {
  try {
    const raw = await request.json()

    // Validate required fields
    const requiredFields = ["customer_name", "payment_method", "payment_amount", "cashier_id", "items"]
    const missingFields = requiredFields.filter((field) => {
      const value = raw[field] ?? raw[{
        customer_name: "customerName",
        payment_method: "paymentMethod",
        payment_amount: "amountPaid",
        cashier_id: "cashierId",
        items: "items",
      }[field] as keyof typeof raw]
      if (field === "items") {
        return !Array.isArray(value) || value.length === 0
      }
      if (field === "payment_amount") {
        return value === undefined || Number.isNaN(Number(value))
      }
      return value === undefined || value === null || value === ""
    })

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing or invalid required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      )
    }
    
    const { transactionService } = await getServices()
    const supabasePayload = {
      customerName: raw.customer_name ?? raw.customerName,
      paymentMethod: raw.payment_method ?? raw.paymentMethod,
      amountPaid: raw.payment_amount ?? raw.amountPaid,
      cashierId: raw.cashier_id ?? raw.cashierId,
      items: (raw.items || []).map((i: any) => ({
        productId: i.product_id ?? i.productId,
        quantity: i.quantity,
        price: i.unit_price ?? i.price,
        subtotal: i.total_price ?? i.subtotal,
      })),
    }
    const transaction = await (transactionService as any).createTransaction(supabasePayload)
    
    return NextResponse.json({
      success: true,
      transaction,
    })
  } catch (error) {
    console.error("[v0] Transaction API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Transaction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

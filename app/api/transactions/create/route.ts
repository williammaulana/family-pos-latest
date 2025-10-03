import { NextResponse } from "next/server"
import { transactionService } from "@/lib/mysql-service"

export async function POST(request: Request) {
  try {
    const transactionData = await request.json()

    // Validate required fields
    const requiredFields = ["customer_name", "payment_method", "payment_amount", "cashier_id", "items"]
    const missingFields = requiredFields.filter((field) => {
      if (field === "items") {
        return !Array.isArray(transactionData.items) || transactionData.items.length === 0
      }
      if (field === "payment_amount") {
        return transactionData.payment_amount === undefined || Number.isNaN(Number(transactionData.payment_amount))
      }
      return transactionData[field] === undefined || transactionData[field] === null || transactionData[field] === ""
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
    
    const transaction = await transactionService.createTransaction(transactionData)
    
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

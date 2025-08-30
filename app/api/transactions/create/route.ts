import { NextResponse } from "next/server"
import { createTransaction } from "@/lib/mysql-service"

export async function POST(request: Request) {
  try {
    const transactionData = await request.json()
    
    const transaction = await createTransaction(transactionData)
    
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
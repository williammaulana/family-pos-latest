import { type NextRequest, NextResponse } from "next/server"
import { createPayment } from "@/lib/xendit-service"

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json()

    const payment = await createPayment(paymentData)

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

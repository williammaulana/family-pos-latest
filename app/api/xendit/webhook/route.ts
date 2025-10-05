import { type NextRequest, NextResponse } from "next/server"
import { transactionService } from "@/lib/supabase-service"

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()

    // Verify webhook signature (implement based on Xendit documentation)
    // const signature = request.headers.get('x-callback-token');

    if (webhookData.status === "SUCCEEDED") {
      // Update transaction status in database
      const transactionId = webhookData.metadata?.transaction_id
      if (transactionId) {
        await transactionService.updateTransactionStatus(transactionId, "completed", {
          xendit_payment_id: webhookData.id,
          payment_method: webhookData.payment_method?.type,
          paid_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

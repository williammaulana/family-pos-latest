import { Xendit } from "xendit-node"

// Initialize Xendit client
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || "YOUR_XENDIT_SECRET_KEY", // TODO: Ganti dengan kunci rahasia Xendit Anda
  publicKey: "xnd_public_development_JQczxxYGxkYoEgxkEr9uZVKJ6rVlz6u49b9ZqC1tGs3KmGTXUWBVDCZpEzXrUv8",
})

export interface XenditPaymentRequest {
  amount: number
  currency: string
  reference_id: string
  description: string
  customer?: {
    given_names?: string
    email?: string
    mobile_number?: string
  }
  payment_method?: {
    type: string
    reusability: string
  }
  metadata?: Record<string, any>
}

export interface XenditPaymentResponse {
  id: string
  status: string
  amount: number
  currency: string
  reference_id: string
  payment_method?: any
  actions?: Array<{
    action: string
    url: string
    url_type: string
  }>
  created: string
  updated: string
}

// Create payment request
export async function createPayment(paymentData: XenditPaymentRequest): Promise<XenditPaymentResponse> {
  try {
    const payment = await xendit.PaymentRequest.createPaymentRequest({
      data: {
        amount: paymentData.amount,
        currency: paymentData.currency || "IDR",
        reference_id: paymentData.reference_id,
        description: paymentData.description,
        customer: paymentData.customer,
        payment_method: paymentData.payment_method || {
          type: "EWALLET",
          reusability: "ONE_TIME_USE",
          ewallet: {
            channel_code: "OVO",
          },
        },
        metadata: paymentData.metadata,
      },
    })

    return payment as XenditPaymentResponse
  } catch (error) {
    console.error("Error creating Xendit payment:", error)
    throw new Error("Failed to create payment")
  }
}

// Get payment status
export async function getPaymentStatus(paymentId: string): Promise<XenditPaymentResponse> {
  try {
    const payment = await xendit.PaymentRequest.getPaymentRequest({
      paymentRequestId: paymentId,
    })

    return payment as XenditPaymentResponse
  } catch (error) {
    console.error("Error getting payment status:", error)
    throw new Error("Failed to get payment status")
  }
}

// Available payment methods
export const XENDIT_PAYMENT_METHODS = {
  QRIS: {
    QRIS: { code: "QRIS", name: "QRIS", icon: "📱", description: "Scan QR Code dengan e-wallet favorit Anda" },
  },
  EWALLET: {
    OVO: { code: "OVO", name: "OVO", icon: "🟠", description: "Bayar dengan OVO" },
    DANA: { code: "DANA", name: "DANA", icon: "🔵", description: "Bayar dengan DANA" },
    LINKAJA: { code: "LINKAJA", name: "LinkAja", icon: "🔴", description: "Bayar dengan LinkAja" },
    SHOPEEPAY: { code: "SHOPEEPAY", name: "ShopeePay", icon: "🟠", description: "Bayar dengan ShopeePay" },
    GOPAY: { code: "GOPAY", name: "GoPay", icon: "🟢", description: "Bayar dengan GoPay" },
  },
  VIRTUAL_ACCOUNT: {
    BCA: { code: "BCA", name: "BCA Virtual Account", icon: "🏦", description: "Transfer ke BCA Virtual Account" },
    BNI: { code: "BNI", name: "BNI Virtual Account", icon: "🏦", description: "Transfer ke BNI Virtual Account" },
    BRI: { code: "BRI", name: "BRI Virtual Account", icon: "🏦", description: "Transfer ke BRI Virtual Account" },
    MANDIRI: { code: "MANDIRI", name: "Mandiri Virtual Account", icon: "🏦", description: "Transfer ke Mandiri Virtual Account" },
  },
  CREDIT_CARD: {
    CREDIT_CARD: { code: "CREDIT_CARD", name: "Credit Card", icon: "💳", description: "Bayar dengan Kartu Kredit" },
  },
}

// Helper function to format payment method for Xendit
export function formatPaymentMethod(type: string, channel: string) {
  switch (type) {
    case "QRIS":
      return {
        type: "QRIS",
        reusability: "ONE_TIME_USE",
        qris: {},
      }
    case "EWALLET":
      return {
        type: "EWALLET",
        reusability: "ONE_TIME_USE",
        ewallet: {
          channel_code: channel,
        },
      }
    case "VIRTUAL_ACCOUNT":
      return {
        type: "VIRTUAL_ACCOUNT",
        reusability: "ONE_TIME_USE",
        virtual_account: {
          channel_code: channel,
        },
      }
    case "CREDIT_CARD":
      return {
        type: "CARD",
        reusability: "ONE_TIME_USE",
        card: {},
      }
    default:
      return {
        type: "QRIS",
        reusability: "ONE_TIME_USE",
        qris: {},
      }
  }
}

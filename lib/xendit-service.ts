import { Xendit } from "xendit-node"

// Initialize Xendit client
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || "xnd_development_...", // Replace with your actual key
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
    const payment = await xendit.Payment.createPayment({
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
    const payment = await xendit.Payment.getPayment({
      paymentId: paymentId,
    })

    return payment as XenditPaymentResponse
  } catch (error) {
    console.error("Error getting payment status:", error)
    throw new Error("Failed to get payment status")
  }
}

// Available payment methods
export const XENDIT_PAYMENT_METHODS = {
  EWALLET: {
    OVO: { code: "OVO", name: "OVO", icon: "🟠" },
    DANA: { code: "DANA", name: "DANA", icon: "🔵" },
    LINKAJA: { code: "LINKAJA", name: "LinkAja", icon: "🔴" },
    SHOPEEPAY: { code: "SHOPEEPAY", name: "ShopeePay", icon: "🟠" },
    GOPAY: { code: "GOPAY", name: "GoPay", icon: "🟢" },
  },
  VIRTUAL_ACCOUNT: {
    BCA: { code: "BCA", name: "BCA Virtual Account", icon: "🏦" },
    BNI: { code: "BNI", name: "BNI Virtual Account", icon: "🏦" },
    BRI: { code: "BRI", name: "BRI Virtual Account", icon: "🏦" },
    MANDIRI: { code: "MANDIRI", name: "Mandiri Virtual Account", icon: "🏦" },
  },
  CREDIT_CARD: {
    CREDIT_CARD: { code: "CREDIT_CARD", name: "Credit Card", icon: "💳" },
  },
}

// Helper function to format payment method for Xendit
export function formatPaymentMethod(type: string, channel: string) {
  switch (type) {
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
        type: "EWALLET",
        reusability: "ONE_TIME_USE",
        ewallet: {
          channel_code: "OVO",
        },
      }
  }
}

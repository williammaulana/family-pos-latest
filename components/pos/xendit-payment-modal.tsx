"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { XENDIT_PAYMENT_METHODS, formatPaymentMethod } from "@/lib/xendit-service"
import { formatCurrency } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface XenditPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onPaymentSuccess: (paymentData: any) => void
  transactionId: string
}

export function XenditPaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess,
  transactionId,
}: XenditPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("QRIS-QRIS")
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const [type, channel] = selectedMethod.split("-")

      const response = await fetch("/api/xendit/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "IDR",
          reference_id: transactionId,
          description: `Pembayaran Family Store - ${transactionId}`,
          customer: {
            given_names: customerData.name,
            email: customerData.email,
            mobile_number: customerData.phone,
          },
          payment_method: formatPaymentMethod(type, channel),
          metadata: {
            transaction_id: transactionId,
          },
        }),
      })

      const paymentData = await response.json()

      if (paymentData.actions && paymentData.actions.length > 0) {
        const paymentAction = paymentData.actions.find((action: any) => action.action === "AUTH") || paymentData.actions[0]
        if (paymentAction) {
          setPaymentUrl(paymentAction.url)
          
          // For QRIS, also get QR code URL
          if (type === "QRIS") {
            setQrCodeUrl(paymentAction.url)
          }
          
          // Simulate successful payment for demo
          setTimeout(() => {
            onPaymentSuccess(paymentData)
            onClose()
          }, 2000)
        }
      } else {
        onPaymentSuccess(paymentData)
        onClose()
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Terjadi kesalahan saat memproses pembayaran")
    } finally {
      setIsProcessing(false)
    }
  }

  const renderPaymentMethods = (): JSX.Element[] => {
    const methods: JSX.Element[] = []

    // QRIS methods (prioritized)
    Object.entries(XENDIT_PAYMENT_METHODS.QRIS).forEach(([key, method]) => {
      methods.push(
        <div key={`QRIS-${key}`} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value={`QRIS-${key}`} id={`QRIS-${key}`} />
          <Label htmlFor={`QRIS-${key}`} className="flex items-center space-x-3 cursor-pointer flex-1">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{method.name}</div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
          </Label>
        </div>,
      )
    })

    // E-Wallet methods
    Object.entries(XENDIT_PAYMENT_METHODS.EWALLET).forEach(([key, method]) => {
      methods.push(
        <div key={`EWALLET-${key}`} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value={`EWALLET-${key}`} id={`EWALLET-${key}`} />
          <Label htmlFor={`EWALLET-${key}`} className="flex items-center space-x-3 cursor-pointer flex-1">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{method.name}</div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
          </Label>
        </div>,
      )
    })

    // Virtual Account methods
    Object.entries(XENDIT_PAYMENT_METHODS.VIRTUAL_ACCOUNT).forEach(([key, method]) => {
      methods.push(
        <div key={`VIRTUAL_ACCOUNT-${key}`} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value={`VIRTUAL_ACCOUNT-${key}`} id={`VIRTUAL_ACCOUNT-${key}`} />
          <Label htmlFor={`VIRTUAL_ACCOUNT-${key}`} className="flex items-center space-x-3 cursor-pointer flex-1">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{method.name}</div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
          </Label>
        </div>,
      )
    })

    // Credit Card methods
    Object.entries(XENDIT_PAYMENT_METHODS.CREDIT_CARD).forEach(([key, method]) => {
      methods.push(
        <div key={`CREDIT_CARD-${key}`} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value={`CREDIT_CARD-${key}`} id={`CREDIT_CARD-${key}`} />
          <Label htmlFor={`CREDIT_CARD-${key}`} className="flex items-center space-x-3 cursor-pointer flex-1">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{method.name}</div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
          </Label>
        </div>,
      )
    })

    return methods
  }

  if (paymentUrl) {
    const [type] = selectedMethod.split("-")
    
    if (type === "QRIS") {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code untuk Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📱</div>
                    <p className="text-sm text-gray-500">QR Code akan muncul di sini</p>
                    <p className="text-xs text-gray-400 mt-1">Gunakan e-wallet favorit Anda untuk scan</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan QR Code di atas dengan aplikasi e-wallet Anda (OVO, DANA, GoPay, dll)
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.open(paymentUrl, "_blank")} className="w-full">
                  Buka Halaman Pembayaran
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Tutup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mengarahkan ke Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Anda akan diarahkan ke halaman pembayaran...</p>
            <Button onClick={() => window.open(paymentUrl, "_blank")} className="w-full">
              Buka Halaman Pembayaran
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran Xendit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Total Pembayaran</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
          </div>

          <div className="space-y-3">
            <Label>Data Pelanggan</Label>
            <div className="space-y-2">
              <Input
                placeholder="Nama Lengkap"
                value={customerData.name}
                onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email"
                value={customerData.email}
                onChange={(e) => setCustomerData((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Nomor Telepon"
                value={customerData.phone}
                onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Pilih Metode Pembayaran</Label>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-2 max-h-64 overflow-y-auto">{renderPaymentMethods()}</div>
            </RadioGroup>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Batal
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !customerData.name || !customerData.email}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

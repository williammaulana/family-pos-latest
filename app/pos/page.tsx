"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductGrid, type ProductGridRef } from "@/components/pos/product-grid"
import { ShoppingCart } from "@/components/pos/shopping-cart"
import { CheckoutForm } from "@/components/pos/checkout-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShoppingCart as ShoppingCartIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product, TransactionItem } from "@/types"

export default function POSPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const productGridRef = useRef<ProductGridRef>(null)
  const [cartItems, setCartItems] = useState<TransactionItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [transactionData, setTransactionData] = useState<{
    code: string
    customerName: string
    paymentMethod: string
    amountPaid: number
    change: number
    cashierName: string
    transactionDate: Date
  } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id)

      if (existingItem) {
        // Check stock limit
        if (existingItem.quantity >= product.stock) {
          toast({
            title: "Stok tidak mencukupi",
            description: `Stok ${product.name} hanya tersisa ${product.stock}`,
            variant: "destructive",
          })
          return prev
        }

        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item,
        )
      }

      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          subtotal: product.price,
        },
      ]
    })

    toast({
      title: "Produk ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    })
  }

  const updateItemDiscount = (productId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              discountType,
            }
          : item,
      ),
    )
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(productId)
      return
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item,
      ),
    )
  }

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const startNewTransaction = () => {
    setShowReceipt(false)
    setTransactionData(null)
    clearCart()
  }

  const handleCheckout = async (customerName: string, paymentMethod: string, amountPaid: number, transactionDiscount?: { type: 'percentage' | 'fixed', value: number }) => {
    if (!user) return

    setIsProcessing(true)

    try {
      console.log("[v0] Starting checkout process", { customerName, paymentMethod, amountPaid })

      // Calculate item-level discounts
      const calculateItemSubtotal = (item: TransactionItem) => {
        const baseSubtotal = item.price * item.quantity
        if (item.discount && item.discountType) {
          const discountAmount = item.discountType === 'percentage'
            ? (baseSubtotal * item.discount) / 100
            : item.discount
          return Math.max(0, baseSubtotal - discountAmount)
        }
        return baseSubtotal
      }

      const subtotal = cartItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
      const tax = 0
      const beforeDiscountTotal = subtotal

      // Apply transaction-level discount
      let transactionDiscountAmount = 0
      if (transactionDiscount) {
        transactionDiscountAmount = transactionDiscount.type === 'percentage'
          ? Math.floor((beforeDiscountTotal * transactionDiscount.value) / 100)
          : Math.floor(transactionDiscount.value)
      }

      const total = Math.max(0, beforeDiscountTotal - transactionDiscountAmount)

      // Fix for "pas" payment method: if paymentMethod is "pas", set amountPaid to total
      if (paymentMethod === "pas") {
        amountPaid = total
      }

      const change = amountPaid - total

      console.log("[v0] Transaction calculations", { subtotal, tax, beforeDiscountTotal, transactionDiscountAmount, total, change })

      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName || "Walk-in Customer",
          total_amount: total,
          tax_amount: tax,
          discount_amount: transactionDiscountAmount,
          payment_amount: amountPaid,
          change_amount: change,
          payment_method: paymentMethod === 'cash' ? 'tunai' : (paymentMethod === 'digital' ? 'qris' : paymentMethod),
          cashier_id: user.id,
          items: cartItems.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: (() => {
              const baseSubtotal = item.price * item.quantity
              if (item.discount && item.discountType) {
                const discountAmount = item.discountType === 'percentage'
                  ? (baseSubtotal * item.discount) / 100
                  : item.discount
                return Math.max(0, baseSubtotal - discountAmount)
              }
              return baseSubtotal
            })(),
            discount: (() => {
              const baseSubtotal = item.price * item.quantity
              if (item.discount && item.discountType) {
                const discountAmount = item.discountType === 'percentage'
                  ? (baseSubtotal * item.discount) / 100
                  : item.discount
                return Math.min(baseSubtotal, Math.max(0, discountAmount))
              }
              return 0
            })(),
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create transaction")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.details || "Transaction failed")
      }

      const transaction = result.transaction

      console.log("[v0] Transaction created successfully", transaction)

      // Set transaction data for receipt
      setTransactionData({
        code: transaction.transaction_code,
        customerName: customerName || "Walk-in Customer",
        paymentMethod: paymentMethod,
        amountPaid: amountPaid,
        change: change,
        cashierName: user.name,
        transactionDate: new Date()
      })

      // Show receipt
      setShowReceipt(true)

      toast({
        title: "Transaksi berhasil!",
        description: `Kode transaksi: ${transaction.transaction_code}`,
      })

      // Clear cart after successful transaction
      clearCart()

      // Refetch product data to update stock
      productGridRef.current?.refetch()
    } catch (error) {
      console.error("[v0] Transaction error:", error)
      toast({
        title: "Transaksi gagal",
        description: "Terjadi kesalahan saat memproses transaksi",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout title="Kasir">
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Product Grid */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <ProductGrid ref={productGridRef} onAddToCart={addToCart} />
          </div>

          {/* Cart Button for Mobile */}
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <Button
              onClick={() => setShowCartDialog(true)}
              className="rounded-full h-14 w-14 shadow-lg"
              size="icon"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>

          {/* Cart and Checkout for Desktop */}
          <div className="hidden lg:flex lg:flex-col space-y-6 min-h-0">
            <div className="flex-1 min-h-0">
              <ShoppingCart
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                onUpdateDiscount={updateItemDiscount}
              />
            </div>
            <div className="flex-shrink-0">
              <CheckoutForm
                items={cartItems}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                showReceipt={showReceipt}
                transactionData={transactionData || undefined}
                onNewTransaction={startNewTransaction}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cart Dialog for Mobile */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 py-4">
            <DialogTitle>Keranjang Belanja</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="space-y-4">
              <ShoppingCart
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                onUpdateDiscount={updateItemDiscount}
              />
              <CheckoutForm
                items={cartItems}
                onCheckout={(customerName, paymentMethod, amountPaid, transactionDiscount) => {
                  handleCheckout(customerName, paymentMethod, amountPaid, transactionDiscount)
                  setShowCartDialog(false)
                }}
                isProcessing={isProcessing}
                showReceipt={showReceipt}
                transactionData={transactionData || undefined}
                onNewTransaction={startNewTransaction}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

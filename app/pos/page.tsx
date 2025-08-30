"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductGrid } from "@/components/pos/product-grid"
import { ShoppingCart } from "@/components/pos/shopping-cart"
import { CheckoutForm } from "@/components/pos/checkout-form"
import { useToast } from "@/hooks/use-toast"
import { createTransaction } from "@/lib/mysql-service"
import type { Product, TransactionItem } from "@/types"

export default function POSPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<TransactionItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleCheckout = async (customerName: string, paymentMethod: string, amountPaid: number) => {
    if (!user) return

    setIsProcessing(true)

    try {
      console.log("[v0] Starting checkout process", { customerName, paymentMethod, amountPaid })

      const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
      const tax = subtotal * 0.1 // 10% tax
      const total = subtotal + tax
      const change = amountPaid - total

      console.log("[v0] Transaction calculations", { subtotal, tax, total, change })

      const transaction = await createTransaction({
        customer_name: customerName || "Walk-in Customer",
        total_amount: total,
        tax_amount: tax,
        payment_amount: amountPaid,
        change_amount: change,
        payment_method: paymentMethod, // Pastikan ini sesuai dengan constraint: tunai, kartu_debit, kartu_kredit, e_wallet
        cashier_id: user.id,
        items: cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.subtotal,
        })),
      })

      console.log("[v0] Transaction created successfully", transaction)

      toast({
        title: "Transaksi berhasil!",
        description: `Kode transaksi: ${transaction.transaction_code}`,
      })

      // Clear cart after successful transaction
      clearCart()
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Product Grid */}
        <div className="lg:col-span-2">
          <ProductGrid onAddToCart={addToCart} />
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-6">
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
          />
          <CheckoutForm items={cartItems} onCheckout={handleCheckout} isProcessing={isProcessing} />
        </div>
      </div>
    </DashboardLayout>
  )
}

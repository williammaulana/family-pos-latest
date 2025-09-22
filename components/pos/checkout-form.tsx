'use client'

import type React from 'react'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/supabase-service'
import type { TransactionItem } from '@/types'
import { XenditPaymentModal } from './xendit-payment-modal'

interface CheckoutFormProps {
  items: TransactionItem[]
  onCheckout: (customerName: string, paymentMethod: string, amountPaid: number) => void
  isProcessing: boolean
}

export function CheckoutForm({ items, onCheckout, isProcessing }: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(10) // default tax rate percentage
  const [showXenditModal, setShowXenditModal] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = Math.floor(subtotal * (taxRate / 100)) // integer tax calculation based on taxRate
  const total = subtotal + tax
  const change = amountPaid - total

  // Sync totalAmount state with total
  if (totalAmount !== total) {
    setTotalAmount(total)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    if (paymentMethod !== 'cash') {
      // Generate transaction ID for Xendit
      const txnId = `TXN${Date.now()}`
      setTransactionId(txnId)
      setShowXenditModal(true)
      return
    }

    if (paymentMethod === 'cash' && amountPaid < total) return

    onCheckout(customerName || 'Walk-in Customer', paymentMethod, amountPaid)
  }

  const handleXenditPaymentSuccess = (paymentData: any) => {
    onCheckout(customerName || 'Walk-in Customer', 'xendit', total)
    setShowXenditModal(false)
  }

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount)
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className='p-6 text-center text-muted-foreground'>
          <p>Tambahkan produk ke keranjang untuk checkout</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Customer Info */}
            <div className='space-y-2'>
              <Label htmlFor='customer'>Nama Pelanggan (Opsional)</Label>
              <Input
                id='customer'
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='Masukkan nama pelanggan'
              />
            </div>

            {/* Payment Method */}
            <div className='space-y-2'>
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='cash'>Tunai</SelectItem>
                  <SelectItem value='digital'>Pembayaran Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amount (for cash) */}
            {paymentMethod === 'cash' && (
              <div className='space-y-2'>
                <Label htmlFor='amount'>Jumlah Dibayar</Label>
                <Input
                  id='amount'
                  type='text'
                  value={amountPaid === 0 ? '' : amountPaid.toString()}
                  onChange={(e) => setAmountPaid(Number.parseFloat(e.target.value) || 0)}
                  placeholder='0'
                  min={total}
                />
                <div className='flex gap-2 flex-wrap'>
                  {[50000, 100000, 200000, 500000].map((amount) => (
                    <Button
                      key={amount}
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => handleQuickAmount(amount)}>
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      handleQuickAmount(total)
                      setAmountPaid(total)
                    }}>
                    Pas
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod !== 'cash' && (
              <div className='bg-blue-50 p-3 rounded-lg'>
                <p className='text-sm text-blue-700'>
                  Pembayaran akan diproses melalui Xendit dengan berbagai metode seperti e-wallet (OVO, DANA, GoPay),
                  virtual account, dan kartu kredit.
                </p>
              </div>
            )}

            <Separator />

            {/* Summary */}
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Pajak:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className='flex justify-between font-bold'>
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {paymentMethod === 'cash' && amountPaid > 0 && (
                <>
                  <div className='flex justify-between text-sm'>
                    <span>Dibayar:</span>
                    <span>{formatCurrency(amountPaid)}</span>
                  </div>
                  <div className='flex justify-between font-bold text-green-600'>
                    <span>Kembalian:</span>
                    <span>{formatCurrency(Math.max(0, change))}</span>
                  </div>
                </>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={isProcessing || items.length === 0 || (paymentMethod === 'cash' && amountPaid < total)}>
              {isProcessing
                ? 'Memproses...'
                : paymentMethod !== 'cash'
                ? 'Lanjut ke Pembayaran Digital'
                : 'Proses Pembayaran'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <XenditPaymentModal
        isOpen={showXenditModal}
        onClose={() => setShowXenditModal(false)}
        amount={total}
        onPaymentSuccess={handleXenditPaymentSuccess}
        transactionId={transactionId}
      />
    </>
  )
}

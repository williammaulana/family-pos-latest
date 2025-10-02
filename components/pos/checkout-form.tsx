'use client'

import type React from 'react'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/supabase-service'
import type { TransactionItem } from '@/types'
import { XenditPaymentModal } from './xendit-payment-modal'
import { Receipt } from './receipt'

interface CheckoutFormProps {
  items: TransactionItem[]
  onCheckout: (customerName: string, paymentMethod: string, amountPaid: number, transactionDiscount?: { type: 'percentage' | 'fixed', value: number }) => void
  isProcessing: boolean
  showReceipt?: boolean
  transactionData?: {
    code: string
    customerName: string
    paymentMethod: string
    amountPaid: number
    change: number
    cashierName: string
    transactionDate: Date
  }
  onNewTransaction?: () => void
}

export function CheckoutForm({ items, onCheckout, isProcessing, showReceipt, transactionData, onNewTransaction }: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(10) // default tax rate percentage
  const [showXenditModal, setShowXenditModal] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [transactionDiscount, setTransactionDiscount] = useState<{ type: 'percentage' | 'fixed', value: number } | null>(null)
  const [showDiscountDialog, setShowDiscountDialog] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')

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

  const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const tax = Math.floor(subtotal * (taxRate / 100)) // integer tax calculation based on taxRate
  const beforeDiscountTotal = subtotal + tax
  
  // Apply transaction-level discount
  let transactionDiscountAmount = 0
  if (transactionDiscount) {
    transactionDiscountAmount = transactionDiscount.type === 'percentage'
      ? (beforeDiscountTotal * transactionDiscount.value) / 100
      : transactionDiscount.value
  }
  
  const total = Math.max(0, beforeDiscountTotal - transactionDiscountAmount)
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

    onCheckout(customerName || 'Walk-in Customer', paymentMethod, amountPaid, transactionDiscount || undefined)
  }

  const handleXenditPaymentSuccess = (paymentData: any) => {
    onCheckout(customerName || 'Walk-in Customer', 'xendit', total, transactionDiscount || undefined)
    setShowXenditModal(false)
  }

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount)
  }

  const handleDiscountSubmit = () => {
    setTransactionDiscount({ type: discountType, value: discountValue })
    setShowDiscountDialog(false)
  }

  const removeTransactionDiscount = () => {
    setTransactionDiscount(null)
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

  if (showReceipt && transactionData) {
    return (
      <Receipt
        transactionCode={transactionData.code}
        customerName={transactionData.customerName}
        items={items}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={transactionData.paymentMethod}
        amountPaid={transactionData.amountPaid}
        change={transactionData.change}
        cashierName={transactionData.cashierName}
        transactionDate={transactionData.transactionDate}
        transactionDiscount={transactionDiscount || undefined}
        onNewTransaction={onNewTransaction}
      />
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

            {/* Transaction Discount */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Diskon Transaksi</Label>
                {transactionDiscount ? (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-green-600'>
                      {transactionDiscount.type === 'percentage' 
                        ? `${transactionDiscount.value}%` 
                        : formatCurrency(transactionDiscount.value)}
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={removeTransactionDiscount}
                      className='h-6 w-6 p-0 text-red-500'
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setShowDiscountDialog(true)}
                  >
                    Tambah Diskon
                  </Button>
                )}
              </div>
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
              {transactionDiscount && (
                <div className='flex justify-between text-sm text-green-600'>
                  <span>Diskon Transaksi:</span>
                  <span>-{formatCurrency(transactionDiscountAmount)}</span>
                </div>
              )}
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

      {/* Transaction Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Diskon Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Diskon</Label>
              <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Persentase (%)</SelectItem>
                  <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nilai Diskon</Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number.parseFloat(e.target.value) || 0)}
                placeholder={discountType === 'percentage' ? '0' : '0'}
                min="0"
                max={discountType === 'percentage' ? 100 : undefined}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleDiscountSubmit}>
                Terapkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

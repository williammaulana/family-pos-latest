"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { TransactionItem } from "@/types"
import { Printer, Download } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ReceiptProps {
  transactionCode: string
  customerName: string
  items: TransactionItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  amountPaid: number
  change: number
  cashierName: string
  transactionDate: Date
  transactionDiscount?: { type: 'percentage' | 'fixed', value: number }
  onNewTransaction?: () => void
}

export function Receipt({
  transactionCode,
  customerName,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  amountPaid,
  change,
  cashierName,
  transactionDate,
  transactionDiscount,
  onNewTransaction
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Struk - ${transactionCode}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  margin: 0; 
                  padding: 20px;
                  background: white;
                }
                .receipt { 
                  max-width: 300px; 
                  margin: 0 auto; 
                  background: white;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .store-address { font-size: 10px; color: #666; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .item-name { flex: 1; }
                .item-price { text-align: right; }
                .total-section { margin-top: 15px; }
                .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
                .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const handleDownloadPDF = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true
        })
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, 200] // Receipt size
        })
        
        const imgWidth = 80
        const pageHeight = 200
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        
        let position = 0
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        
        pdf.save(`struk-${transactionCode}.pdf`)
      } catch (error) {
        console.error('Error generating PDF:', error)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash':
      case 'tunai':
        return 'Tunai'
      case 'digital':
      case 'xendit':
      case 'e_wallet':
        return 'E-Wallet / Digital'
      case 'qris':
        return 'QRIS'
      case 'transfer_bank':
        return 'Transfer Bank'
      case 'kartu_debit':
        return 'Kartu Debit'
      case 'kartu_kredit':
        return 'Kartu Kredit'
      default:
        return method
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 no-print">
        <Button onClick={handlePrint} size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Cetak Struk
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        {onNewTransaction && (
          <Button onClick={onNewTransaction} variant="default" size="sm" className="flex items-center gap-2">
            Transaksi Baru
          </Button>
        )}
      </div>

      <Card ref={receiptRef} className="max-w-sm mx-auto bg-white">
        <CardContent className="p-4">
          {/* Store Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">FAMILY STORE</h2>
            <p className="text-xs text-gray-600">Toko Kelontong Serba Rp15.000</p>
            <p className="text-xs text-gray-600">Jl. Contoh No. 123, Jakarta</p>
            <p className="text-xs text-gray-600">Telp: (021) 1234-5678</p>
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Transaction Info */}
          <div className="mb-3">
            <div className="flex justify-between text-sm">
              <span>No. Transaksi:</span>
              <span className="font-mono">{transactionCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tanggal:</span>
              <span>{formatDate(transactionDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Kasir:</span>
              <span>{cashierName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pelanggan:</span>
              <span>{customerName}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Items */}
          <div className="mb-3">
            {items.map((item) => {
              const itemSubtotal = calculateItemSubtotal(item)
              const hasDiscount = item.discount && item.discount > 0
              
              return (
                <div key={item.productId} className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.productName}</span>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                    <span>{formatCurrency(itemSubtotal)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Diskon ({item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}):</span>
                      <span>-{formatCurrency((item.price * item.quantity) - itemSubtotal)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {transactionDiscount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Transaksi ({transactionDiscount.type === 'percentage' ? `${transactionDiscount.value}%` : formatCurrency(transactionDiscount.value)}):</span>
                <span>-{formatCurrency(transactionDiscount.type === 'percentage' ? subtotal * transactionDiscount.value / 100 : transactionDiscount.value)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Payment Info */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Metode:</span>
              <span>{formatPaymentMethod(paymentMethod)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dibayar:</span>
              <span>{formatCurrency(amountPaid)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Kembalian:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
            <p className="mt-2">www.familystore.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

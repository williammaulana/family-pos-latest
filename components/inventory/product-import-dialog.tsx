"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { parseCSV, parseExcel, exportToCSV, exportToExcel } from "@/lib/export-utils"
import { productService } from "@/lib/supabase-service"
import { useToast } from "@/hooks/use-toast"

interface ProductImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function ProductImportDialog({ isOpen, onClose, onImportComplete }: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<string[][] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const { toast } = useToast()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const isCSV = selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")
    const isExcel =
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    if (isCSV || isExcel) {
      setFile(selectedFile)
      setErrors([])

      try {
        let parsed: string[][]

        if (isCSV) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const csvText = e.target?.result as string
            parsed = parseCSV(csvText)
            setPreviewData(parsed.slice(0, 6)) // Show first 5 rows + header
          }
          reader.readAsText(selectedFile)
        } else {
          // Handle Excel files
          parsed = await parseExcel(selectedFile)
          setPreviewData(parsed.slice(0, 6))
        }
      } catch (error) {
        toast({
          title: "Error membaca file",
          description: "Terjadi kesalahan saat membaca file",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "File tidak valid",
        description: "Silakan pilih file CSV atau Excel (.xlsx) yang valid",
        variant: "destructive",
      })
    }
  }

  const validateData = (data: string[][]): string[] => {
    const errors: string[] = []
    const headers = data[0]

    const requiredHeaders = ["name", "sku", "category", "price", "stock", "min_stock"]
    const missingHeaders = requiredHeaders.filter((header) => !headers.some((h) => h.toLowerCase().includes(header)))

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`)
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (row.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`)
      }

      // Validate price and stock are numbers
      const priceIndex = headers.findIndex((h) => h.toLowerCase().includes("price"))
      const stockIndex = headers.findIndex((h) => h.toLowerCase().includes("stock"))

      if (priceIndex >= 0 && isNaN(Number(row[priceIndex]))) {
        errors.push(`Row ${i + 1}: Invalid price value`)
      }

      if (stockIndex >= 0 && isNaN(Number(row[stockIndex]))) {
        errors.push(`Row ${i + 1}: Invalid stock value`)
      }
    }

    return errors
  }

  const handleImport = async () => {
    if (!file || !previewData) return

    setIsProcessing(true)
    try {
      let parsed: string[][]

      if (file.name.endsWith(".csv")) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const csvText = e.target?.result as string
          parsed = parseCSV(csvText)
          await processImportData(parsed)
        }
        reader.readAsText(file)
      } else {
        parsed = await parseExcel(file)
        await processImportData(parsed)
      }
    } catch (error) {
      toast({
        title: "Import Gagal",
        description: "Terjadi kesalahan saat mengimpor data",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const processImportData = async (parsed: string[][]) => {
    const validationErrors = validateData(parsed)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setIsProcessing(false)
      return
    }

    const headers = parsed[0]
    const nameIndex = headers.findIndex((h) => h.toLowerCase().includes("name"))
    const skuIndex = headers.findIndex((h) => h.toLowerCase().includes("sku"))
    const categoryIndex = headers.findIndex((h) => h.toLowerCase().includes("category"))
    const priceIndex = headers.findIndex((h) => h.toLowerCase().includes("price"))
    const stockIndex = headers.findIndex((h) => h.toLowerCase().includes("stock"))
    const minStockIndex = headers.findIndex((h) => h.toLowerCase().includes("min_stock"))

    let successCount = 0
    let errorCount = 0

    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i]
      try {
        await productService.createProduct({
          name: row[nameIndex],
          sku: row[skuIndex],
          category: row[categoryIndex],
          price: Number(row[priceIndex]),
          stock: Number(row[stockIndex]),
          min_stock: Number(row[minStockIndex]),
        })
        successCount++
      } catch (error) {
        errorCount++
        console.error(`Error importing row ${i + 1}:`, error)
      }
    }

    toast({
      title: "Import Selesai",
      description: `${successCount} produk berhasil diimpor, ${errorCount} gagal`,
    })

    onImportComplete()
    onClose()
    setFile(null)
    setPreviewData(null)
    setErrors([])
    setIsProcessing(false)
  }

  const downloadTemplate = (format: "csv" | "excel" = "csv") => {
    const template = [
      ["name", "sku", "category", "price", "stock", "min_stock"],
      ["Contoh Produk", "SKU001", "Makanan", "15000", "100", "10"],
      ["Produk Lain", "SKU002", "Minuman", "8000", "50", "5"],
    ]

    if (format === "excel") {
      exportToExcel({
        headers: template[0],
        rows: template.slice(1),
        filename: "template-import-produk",
      })
    } else {
      exportToCSV({
        headers: template[0],
        rows: template.slice(1),
        filename: "template-import-produk",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Produk</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Pilih File</Label>
            <Input id="csv-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="mt-1" />
            <p className="text-sm text-gray-500 mt-1">
              File harus berformat CSV atau Excel dengan kolom: name, sku, category, price, stock, min_stock
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => downloadTemplate("csv")} className="flex-1 bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate("excel")} className="flex-1 bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Download Template Excel
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewData && (
            <div>
              <Label>Preview Data (5 baris pertama)</Label>
              <div className="mt-2 border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData[0].map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left font-medium text-xs sm:text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-xs sm:text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="order-2 sm:order-1 bg-transparent">
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing || errors.length > 0}
              className="order-1 sm:order-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { parseCSV, parseExcel, exportToCSV, exportToExcel } from "@/lib/export-utils"
// import { productService } from "@/lib/supabase-service"
import { warehouseService, storeService } from "@/lib/locations-service"
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
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [locationType, setLocationType] = useState<"warehouse" | "store">("warehouse")
  const [locationId, setLocationId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      const [ws, ss] = await Promise.all([warehouseService.list(), storeService.list()])
      setWarehouses(ws || [])
      setStores(ss || [])
    })()
  }, [])

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

  function normalizeHeader(s: string) {
    return (
      s
        ?.toString()
        // hapus karakter tak terlihat (BOM, zero-width joiner/space)
        .replace(/^[\uFEFF]/, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // hapus non-breaking space dari Excel
        .replace(/\u00A0/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "_")
    )
  }

  const headerAliases: Record<string, string[]> = {
    name: ["name", "nama", "nama_produk", "product_name"],
    sku: ["sku", "kode", "kode_barang", "kodeproduk", "barcode", "kode_barcode"],
    category: ["category", "kategori", "kategori_produk"],
    price: ["price", "harga", "harga_jual", "harga_produk"],
    stock: ["stock", "stok", "qty", "jumlah", "jumlah_stok"],
    min_stock: ["min_stock", "stok_minimum", "stok_min", "min_stok", "minimal_stok", "minimum_stock", "minstock"],
  }

  const requiredKeys: Array<keyof typeof headerAliases> = ["name", "sku", "category", "price", "stock", "min_stock"]

  const displayName: Record<keyof typeof headerAliases, string> = {
    name: "nama",
    sku: "sku",
    category: "kategori",
    price: "harga",
    stock: "stok",
    min_stock: "stok_minimum",
  }

  function findIndexFor(key: keyof typeof headerAliases, headers: string[]) {
    const normalizedHeaders = headers.map((h) => normalizeHeader(h))
    const candidates = headerAliases[key].map((h) => normalizeHeader(h))
    return normalizedHeaders.findIndex((h) => candidates.includes(h))
  }

  const validateData = (data: string[][]): string[] => {
    const errors: string[] = []
    const headers = data[0] || []

    // Debugging aid: see raw and normalized headers in logs
    // Remove after verification if desired.
    try {
      const normalized = headers.map((h) => normalizeHeader(h))
      console.log("[v0] Import headers raw:", headers)
      console.log("[v0] Import headers normalized:", normalized)
    } catch {}

    const missing: string[] = []
    for (const k of requiredKeys) {
      if (findIndexFor(k, headers) === -1) {
        missing.push(displayName[k])
      }
    }
    if (missing.length > 0) {
      errors.push(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`)
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (row.length !== headers.length) {
        errors.push(`Baris ${i + 1}: Jumlah kolom tidak sesuai`)
      }

    const priceIndex = findIndexFor("price", headers)
    const stockIndex = findIndexFor("stock", headers)

      if (priceIndex >= 0 && isNaN(Number(row[priceIndex]))) {
        errors.push(`Baris ${i + 1}: Nilai harga tidak valid`)
      }
      if (stockIndex >= 0 && isNaN(Number(row[stockIndex]))) {
        errors.push(`Baris ${i + 1}: Nilai stok tidak valid`)
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

    // Validate location selection
    if (!locationId) {
      setErrors(["Silakan pilih lokasi penyimpanan untuk produk yang diimpor"])
      setIsProcessing(false)
      return
    }

    const headers = parsed[0]
    const nameIndex = findIndexFor("name", headers)
    const skuIndex = findIndexFor("sku", headers)
    const categoryIndex = findIndexFor("category", headers)
    const priceIndex = findIndexFor("price", headers)
    const stockIndex = findIndexFor("stock", headers)
    const minStockIndex = findIndexFor("min_stock", headers)

    let successCount = 0
    let errorCount = 0

    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i]
      try {
        const payload = {
          name: row[nameIndex],
          sku: row[skuIndex],
          category: row[categoryIndex],
          price: Number(row[priceIndex]),
          stock: Number(row[stockIndex]),
          minStock: Number(row[minStockIndex]),
          locationType,
          locationId,
        }
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        successCount++
      } catch (error) {
        errorCount++
        console.error(`[v0] Error importing row ${i + 1}:`, error)
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
      ["nama", "sku", "kategori", "harga", "stok", "stok_minimum"],
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
              {
                "File harus berformat CSV atau Excel dengan kolom: nama (name), sku, kategori (category), harga (price), stok (stock), stok_minimum (min_stock)"
              }
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Lokasi Stok *</Label>
              <Select
                value={locationType}
                onValueChange={(value: "warehouse" | "store") => {
                  setLocationType(value)
                  setLocationId("") // Reset location when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Gudang</SelectItem>
                  <SelectItem value="store">Toko</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Pilih {locationType === "warehouse" ? "Gudang" : "Toko"} *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Pilih ${locationType === "warehouse" ? "gudang" : "toko"}`} />
                </SelectTrigger>
                <SelectContent>
                  {(locationType === "warehouse" ? warehouses : stores).map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="order-2 sm:order-1 bg-transparent">
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing || errors.length > 0 || !locationId}
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

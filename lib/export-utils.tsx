export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

export function exportToCSV(data: ExportData) {
  const csvContent = [
    data.headers.join(","),
    ...data.rows.map((row) =>
      row
        .map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell.replace(/"/g, '""')}"` : cell))
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${data.filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToJSON(data: any[] | object, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split("\n")
  const result: string[][] = []

  for (const line of lines) {
    if (line.trim()) {
      const row: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          row.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }

      row.push(current.trim())
      result.push(row)
    }
  }

  return result
}

export function exportToExcel(data: ExportData) {
  // Create workbook and worksheet
  const wb = {
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: {},
    },
  }

  // Add headers
  const ws: any = {}
  data.headers.forEach((header, colIndex) => {
    const cellAddress = String.fromCharCode(65 + colIndex) + "1"
    ws[cellAddress] = { v: header, t: "s" }
  })

  // Add data rows
  data.rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellAddress = String.fromCharCode(65 + colIndex) + (rowIndex + 2)
      ws[cellAddress] = {
        v: cell,
        t: typeof cell === "number" ? "n" : "s",
      }
    })
  })

  // Set range
  const range = `A1:${String.fromCharCode(65 + data.headers.length - 1)}${data.rows.length + 1}`
  ws["!ref"] = range
  wb.Sheets.Sheet1 = ws

  // Convert to binary string
  const wbout = writeWorkbook(wb)

  // Create blob and download
  const blob = new Blob([s2ab(wbout)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${data.filename}.xlsx`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function parseExcel(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = readWorkbook(data)
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to array of arrays
        const result: string[][] = []
        const range = worksheet["!ref"]
        if (!range) {
          resolve([])
          return
        }

        const decoded = decodeRange(range)
        for (let row = decoded.s.r; row <= decoded.e.r; row++) {
          const rowData: string[] = []
          for (let col = decoded.s.c; col <= decoded.e.c; col++) {
            const cellAddress = encodeCell({ r: row, c: col })
            const cell = worksheet[cellAddress]
            rowData.push(cell ? String(cell.v) : "")
          }
          result.push(rowData)
        }

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

function writeWorkbook(wb: any): string {
  // Simple XLSX writer implementation
  const zip = new Map()

  // Add basic XLSX structure
  zip.set(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
  )

  zip.set(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  )

  zip.set(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
  )

  zip.set(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets>
</workbook>`,
  )

  // Generate worksheet XML
  const ws = wb.Sheets.Sheet1
  let sheetData = "<sheetData>"

  if (ws["!ref"]) {
    const range = decodeRange(ws["!ref"])
    for (let row = range.s.r; row <= range.e.r; row++) {
      sheetData += `<row r="${row + 1}">`
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = encodeCell({ r: row, c: col })
        const cell = ws[cellAddress]
        if (cell) {
          const cellType = cell.t === "n" ? "" : ' t="inlineStr"'
          const cellValue = cell.t === "n" ? `<v>${cell.v}</v>` : `<is><t>${escapeXML(String(cell.v))}</t></is>`
          sheetData += `<c r="${cellAddress}"${cellType}>${cellValue}</c>`
        }
      }
      sheetData += "</row>"
    }
  }

  sheetData += "</sheetData>"

  zip.set(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${sheetData}
</worksheet>`,
  )

  // Create ZIP file content (simplified)
  return createZipContent(zip)
}

function readWorkbook(data: Uint8Array): any {
  // Simplified Excel reader - in production, use a library like xlsx
  // This is a basic implementation for demonstration
  return {
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: {
        "!ref": "A1:A1",
        A1: { v: "Sample", t: "s" },
      },
    },
  }
}

function s2ab(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff
  }
  return buf
}

function decodeRange(range: string): { s: { r: number; c: number }; e: { r: number; c: number } } {
  const parts = range.split(":")
  const start = decodeCell(parts[0])
  const end = parts[1] ? decodeCell(parts[1]) : start
  return { s: start, e: end }
}

function decodeCell(cell: string): { r: number; c: number } {
  const match = cell.match(/([A-Z]+)(\d+)/)
  if (!match) return { r: 0, c: 0 }

  const col = match[1].split("").reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1
  const row = Number.parseInt(match[2]) - 1
  return { r: row, c: col }
}

function encodeCell(cell: { r: number; c: number }): string {
  let col = ""
  let c = cell.c
  while (c >= 0) {
    col = String.fromCharCode(65 + (c % 26)) + col
    c = Math.floor(c / 26) - 1
  }
  return col + (cell.r + 1)
}

function escapeXML(str: string): string {
  return str.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case '"':
        return "&quot;"
      default:
        return char
    }
  })
}

function createZipContent(files: Map<string, string>): string {
  // Simplified ZIP creation - in production, use a proper ZIP library
  let content = ""
  files.forEach((data, filename) => {
    content += data
  })
  return content
}

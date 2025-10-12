import * as XLSX from "xlsx"

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

// CSV parser that respects simple quoted fields
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/)
  const result: string[][] = []

  for (const line of lines) {
    if (!line.trim()) continue
    const row: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        row.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    row.push(current.trim())
    result.push(row)
  }
  return result
}

export async function parseExcel(file: File): Promise<string[][]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<string[]>({ ...sheet }, { header: 1, raw: true }) as unknown as string[][]
  return json
}

export function exportToCSV(opts: ExportData) {
  const { headers, rows, filename } = opts
  const lines = [headers, ...rows]
    .map((row) => row.map((c) => (typeof c === "string" && c.includes(",") ? `"${c}"` : String(c))).join(","))
    .join("\n")
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToExcel(opts: ExportData) {
  const { headers, rows, filename } = opts
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" })
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${filename}.xlsx`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: any[] | object, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${filename}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

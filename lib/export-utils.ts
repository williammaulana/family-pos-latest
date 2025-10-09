import * as XLSX from "xlsx"

export function parseCSV(csvText: string): string[][] {
  const rows = csvText.split(/\r?\n/).filter(Boolean)
  return rows.map((row) => {
    // sederhana: split dengan koma, tanpa menangani escape kompleks
    return row.split(",").map((cell) => cell.trim())
  })
}

export async function parseExcel(file: File): Promise<string[][]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<string[]>({ ...sheet }, { header: 1, raw: true }) as unknown as string[][]
  return json
}

export function exportToCSV(opts: { headers: string[]; rows: (string | number)[][]; filename: string }) {
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

export function exportToExcel(opts: { headers: string[]; rows: (string | number)[][]; filename: string }) {
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

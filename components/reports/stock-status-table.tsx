"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockStockReports } from "@/lib/mock-reports"

export function StockStatusTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "low":
        return <Badge variant="destructive">Menipis</Badge>
      case "out":
        return <Badge variant="destructive">Habis</Badge>
      default:
        return <Badge variant="default">Normal</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Stok</CardTitle>
        <CardDescription>Monitoring stok produk dan alert stok menipis</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Stok Saat Ini</TableHead>
              <TableHead className="text-right">Stok Minimum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir Restock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockStockReports.map((item) => (
              <TableRow key={item.productId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">{item.currentStock}</TableCell>
                <TableCell className="text-right">{item.minStock}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  {item.lastRestocked.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

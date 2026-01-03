import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { SettingsProvider } from "@/lib/settings-context"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Family Store - POS & Inventory",
  description: "Sistem Point of Sale dan Inventory Management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster />
            <Analytics />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { SettingsProvider } from "@/lib/settings-context"
import { Toaster } from "@/components/ui/toaster"

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
  const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
  const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })
  return (
    <html lang="id">
      <body className={`font-sans ${inter.variable} ${lora.variable}`}>
        {/* Global SVG filters for sketch/pencil effects */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <filter id="paper-pencil" x="0" y="0">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.6"/>
          </filter>
        </svg>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

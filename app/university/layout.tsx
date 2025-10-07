import type { Metadata } from "next"
import "./styles.css"
import { UniversityHeader } from "@/components/university/Header"
import { UniversityFooter } from "@/components/university/Footer"

export const metadata: Metadata = {
  title: "Universitas Gadjah Mada",
  description: "Situs publik Universitas Gadjah Mada",
}

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="university-app" className="min-h-screen flex flex-col bg-background text-foreground">
      <UniversityHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <UniversityFooter />
    </div>
  )
}

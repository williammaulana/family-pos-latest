import Link from "next/link"
import { AccessibilityToolbar } from "@/components/university/AccessibilityToolbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function UniversityHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Skip link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-primary text-primary-foreground px-3 py-2 rounded">
        Skip to content
      </a>

      {/* Top utility bar */}
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Universitas Gadjah Mada</span>
          <span className="text-muted-foreground">UNIVERSITAS GADJAH MADA</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground" aria-label="Bahasa">
            <span className="font-medium">ID</span>
          </span>
        </div>
        <nav className="flex items-center gap-4 text-muted-foreground">
          <Link href="#" className="hover:underline">Email</Link>
          <Link href="#" className="hover:underline">Perpustakaan</Link>
          <Link href="#" className="hover:underline">Mahasiswa</Link>
          <Link href="#" className="hover:underline">Staff</Link>
          <Link href="#" className="hover:underline">Alumni</Link>
        </nav>
      </div>

      {/* Branding + Search */}
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/university" className="block">
            <h1 className="text-2xl font-bold leading-tight">Universitas Gadjah Mada</h1>
            <p className="text-muted-foreground">UNIVERSITAS GADJAH MADA</p>
          </Link>
        </div>
        <form action="/university/search" method="GET" className="flex-1 max-w-xl">
          <label className="sr-only" htmlFor="search">Cari</label>
          <div className="flex items-center gap-2">
            <Input id="search" name="q" placeholder="Ketikkan kata kunci lalu ENTER" />
            <Button type="submit">Cari</Button>
          </div>
        </form>
      </div>

      {/* Primary nav */}
      <nav className="container mx-auto px-4 pb-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {[
            "Pendaftaran",
            "Pendidikan",
            "Penelitian",
            "Pengabdian",
            "Layanan",
            "Tentang",
            "SDGs",
            "Berita",
            "PIONIR 2025",
          ].map((item) => (
            <li key={item}>
              <Link href="#" className="hover:underline">{item}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Accessibility Toolbar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-2">
          <AccessibilityToolbar />
        </div>
      </div>
    </header>
  )
}

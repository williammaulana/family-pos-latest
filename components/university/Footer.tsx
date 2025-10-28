export function UniversityFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="font-semibold mb-3">Universitas Gadjah Mada</h2>
          <p className="text-sm text-muted-foreground">
            Bulaksumur, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Kontak</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>E: info@ugm.ac.id</li>
            <li>P: +62(274)588688</li>
            <li>F: +62(274)565223</li>
            <li>WA: +628112869988</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Akses Cepat</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li><a href="#" className="hover:underline">Pusat Bantuan</a></li>
            <li><a href="#" className="hover:underline">Aksesibilitas</a></li>
            <li><a href="#" className="hover:underline">Peta Situs</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>UGM ART</span>
          <span>&copy; {new Date().getFullYear()} Universitas Gadjah Mada</span>
        </div>
      </div>
    </footer>
  )
}

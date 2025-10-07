import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const highlights = [
  {
    tag: "Kegiatan",
    title: "Vet Fun Run UGM, Lari Santai Bersama Hewan Kesayangan",
    summary:
      "Sebanyak 600 an pelari ikut berpartisipasi di ajang Vet Fun Run & Pet Show 2025 dalam rangka memeriahkan perayaan Dies Natalis ke-79 di kampus FKH UGM, sabtu (19/9).",
  },
  {
    tag: "Liputan/Berita",
    title: "Berkunjung ke Wanagama, Megawati Diberi Tanaman Jatimega",
    summary:
      "Melihat Perkembangan Jatimega, Megawati Soekarnoputri Kunjungi Wanagama. Sehari setelah menjadi pembicara workshop Biodiversitas Tropis...",
  },
  {
    tag: "Seminar/Workshop",
    title:
      "Dihadiri Megawati Soekarnoputri, UGM dan BRIN Perkuat Riset dan Hilirisasi Biodiversitas Tropis",
    summary:
      "UGM meneguhkan peran sentralnya dalam riset biodiversitas tropis melalui workshop bersama BRIN di Balai Senat UGM.",
  },
]

const sections: { name: string; items: { title: string; time: string }[] }[] = [
  {
    name: "Berita Terbaru",
    items: [
      { title: "Anak Lebih Rentan Kena DBD, Gejala yang Patut Diwaspadai", time: "6 Oktober 2025, 16.11" },
      { title: "Jumlah Penderita Kanker Mulut Meningkat, Mahasiswa UGM Kembangkan Alat Deteksi Cepat", time: "6 Oktober 2025, 14.33" },
      { title: "Belajar Konservasi Warisan Budaya, Mahasiswa UGM Ikut UNESCO Field School", time: "6 Oktober 2025, 13.48" },
    ],
  },
  {
    name: "Pendidikan",
    items: [
      { title: "Mahasiswa S3 UGM Teliti Efektivitas Remdesivir", time: "3 Oktober 2025, 09.59" },
      { title: "Dosen SPs UGM Prof. Dina Ruslanjari Dikukuhkan jadi Guru Besar", time: "2 Oktober 2025, 16.47" },
      { title: "Dikukuhkan jadi Guru Besar Bidang Sosiofisika, Prof Rinto Soroti Polusi Cahaya", time: "26 September 2025, 12.57" },
    ],
  },
  {
    name: "Prestasi",
    items: [
      { title: "Mahasiswa UGM Sumbang 11 Medali di POMNAS XIX 2025", time: "3 Oktober 2025, 15.05" },
      { title: "Tim Arjuna UGM Raih 6 Penghargaan di Formula SAE Jepang", time: "30 September 2025, 15.42" },
      { title: "14 Dosen UGM Masuk Jajaran 2% Ilmuwan Berpengaruh di Dunia", time: "27 September 2025, 06.17" },
    ],
  },
  {
    name: "Penelitian dan Inovasi",
    items: [
      { title: "Mahasiswa UGM Kembangkan Alat Deteksi Cepat Kanker Mulut", time: "6 Oktober 2025, 14.33" },
      { title: "Antropolog UGM Ikut Riset Panel Surya Terapung", time: "6 Oktober 2025, 11.34" },
      { title: "Tim PKM UGM Ubah Limbah Ternak Jadi Pupuk", time: "6 Oktober 2025, 11.04" },
    ],
  },
]

const categories: { name: string; total: number }[] = [
  { name: "Alumni", total: 72 },
  { name: "Cek Fakta", total: 4 },
  { name: "Inovasi Teknologi", total: 44 },
  { name: "Kabar Fakultas", total: 933 },
  { name: "Kerjasama", total: 133 },
  { name: "Kuliah Kerja Nyata", total: 131 },
  { name: "Liputan/Berita", total: 13055 },
  { name: "Pendidikan", total: 1345 },
  { name: "Penelitian dan Inovasi", total: 520 },
  { name: "Prestasi", total: 1061 },
  { name: "Seminar/Workshop", total: 136 },
  { name: "Seputar Kampus", total: 824 },
]

const videos = [
  { title: "UGM Menjawab Polemik Ijazah Joko Widodo", time: "22 Agustus 2025, 16.17" },
  { title: "Joko Widodo Hadir di Reuni Angkatan '80 Kehutanan", time: "8 Agustus 2025, 15.43" },
  { title: "Mengabdi Bersama Warga, Mahasiswa Gali Potensi Papua", time: "8 Agustus 2025, 15.41" },
]

export default function UniversityHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="container mx-auto px-4 pt-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Badge className="mb-3">Vet Fun Run & Pet Show</Badge>
            <h2 className="text-3xl font-bold leading-tight">Universitas Gadjah Mada</h2>
            <p className="text-muted-foreground">UNIVERSITAS GADJAH MADA</p>
            <div className="mt-4">
              <h3 className="text-xl font-semibold">Vet Fun Run UGM, Lari Santai Bersama Hewan Kesayangan</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-prose">
                Sebanyak 600 an pelari ikut berpartisipasi di ajang Vet Fun Run & Pet Show 2025 dalam rangka memeriahkan perayaan Dies Natalis ke-79 di kampus FKH UGM.
              </p>
              <div className="mt-3">
                <Button asChild size="sm"><Link href="#">Selengkapnya</Link></Button>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {highlights.map((h) => (
              <Card key={h.title}>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">{h.tag}</Badge>
                  <CardTitle className="text-base">{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{h.summary}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container mx-auto px-4 mt-10 grid gap-10">
        {sections.map((section) => (
          <div key={section.name}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">{section.name}</h3>
              <Link className="text-sm text-primary hover:underline" href="#">Lihat semua</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {section.items.map((item) => (
                <Card key={item.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{item.time}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Categories and Videos */}
      <section className="container mx-auto px-4 mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-3">Kategori</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <Card key={c.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{c.total} Artikel Total</CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Video</h3>
          <div className="grid gap-3">
            {videos.map((v) => (
              <Card key={v.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{v.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{v.time}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export const PRODUCTS = [
  {
    name: "Gleans Shield",
    tag: "GLEANS SHIELD",
    href: "/deteksi-ai",
    icon: "/images/logo-gleans-shield.svg",
    short: "Deteksi AI",
    description: "Membantu kamu mendeteksi tingkat plagiarisme dan AI menggunakan GPTZero.",
    soon: false,
  },
  {
    name: "Gleans Writer",
    tag: "GLEANS WRITER",
    href: "/parafrase",
    icon: "/images/logo-gleans-writer.svg",
    short: "Parafrase",
    description: "Membantu kamu memparafrase kata atau kalimat dengan lebih mudah.",
    soon: true,
  },
  {
    name: "Gleans Cite",
    tag: "GLEANS CITE",
    href: "/sitasi",
    icon: "/images/logo-gleans-cite.svg",
    short: "Cite Generator",
    description: "Membantu menyusun sumber referensi dan buat sitasi dengan berbagai format.",
    soon: true,
  },
  {
    name: "Gleans File",
    tag: "GLEANS FILE",
    href: "/file",
    icon: "/images/logo-gleans-file.svg",
    short: "Manajemen File",
    description: "Konversi dokumen dan gambar ke PDF, gabungkan PDF, serta kompres file dalam satu tempat.",
    soon: false,
  },
] as const;

export const NAV_LINKS = [
  { label: "Cek Pesanan", href: "/cek-pesanan" },
  { label: "Harga", href: "/#harga" },
  { label: "Blog", href: "/blog" },
  { label: "Kontak kami", href: "#kontak" },
] as const;

export const CONTACT = {
  phone: "+62 819-9809-6254",
  whatsapp: "https://wa.me/6281998096254",
  email: "team@gleans.my.id",
  instagram: "@gleans.id",
  instagramUrl: "https://instagram.com/gleans.id",
};

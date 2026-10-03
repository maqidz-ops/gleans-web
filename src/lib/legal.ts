import type { LegalSection } from "@/components/legal/legal-document";

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: "Data yang Dikumpulkan",
    bullets: [
      "Data akun: nama, email, nomor WhatsApp, dan data transaksi.",
      "Data layanan: file/dokumen yang diunggah, metadata order, serta log proses teknis.",
      "Data perangkat dasar: alamat IP, user-agent, dan waktu akses untuk keamanan dan audit.",
    ],
  },
  {
    title: "Tujuan Penggunaan Data",
    bullets: [
      "Memproses order dan mengirim hasil layanan.",
      "Verifikasi pembayaran, dukungan pelanggan, dan penanganan komplain.",
      "Peningkatan keamanan sistem, pencegahan penyalahgunaan, serta analitik operasional internal.",
    ],
  },
  {
    title: "Penyimpanan dan Penghapusan Dokumen",
    paragraphs: [
      "Dokumen pengguna disimpan seperlunya untuk menjalankan layanan, lalu dihapus sesuai kebijakan retensi internal. Kami tidak menggunakan dokumen pengguna untuk pelatihan model tanpa persetujuan eksplisit.",
    ],
  },
  {
    title: "Berbagi Data ke Pihak Ketiga",
    paragraphs: [
      "Data dapat diproses oleh penyedia infrastruktur/pembayaran yang relevan untuk menjalankan layanan. Kami membatasi akses hanya pada kebutuhan operasional yang sah.",
    ],
  },
  {
    title: "Keamanan Data",
    paragraphs: [
      "Kami menerapkan kontrol teknis dan administratif yang wajar untuk melindungi data dari akses tidak sah, perubahan, atau kebocoran.",
    ],
  },
  {
    title: "Hak Pengguna",
    bullets: [
      "Meminta akses atau koreksi data akun.",
      "Meminta penghapusan data sesuai ketentuan hukum dan kebutuhan operasional minimum.",
      "Mencabut persetujuan komunikasi non-esensial kapan saja.",
    ],
  },
  {
    title: "Cookie dan Session",
    paragraphs: [
      "Kami menggunakan cookie/session untuk autentikasi, keamanan, dan kenyamanan penggunaan situs.",
    ],
  },
  {
    title: "Perubahan Kebijakan",
    paragraphs: [
      "Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan berlaku sejak dipublikasikan pada halaman ini.",
    ],
  },
  {
    title: "Kontak Privasi",
    paragraphs: [
      "Jika Anda memiliki pertanyaan tentang kebijakan ini atau permintaan terkait data pribadi, silakan hubungi kanal resmi customer service kami.",
    ],
  },
];

export const TERMS: LegalSection[] = [
  {
    title: "Penerimaan Ketentuan",
    paragraphs: [
      "Dengan mengakses atau menggunakan layanan Gleans, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan pada halaman ini. Jika Anda tidak menyetujuinya, mohon tidak menggunakan layanan kami.",
    ],
  },
  {
    title: "Ruang Lingkup Layanan",
    bullets: [
      "Gleans Shield: pemeriksaan indikasi tulisan AI dan plagiarisme pada dokumen yang Anda unggah.",
      "Gleans Writer: bantuan parafrase kata dan kalimat.",
      "Gleans Cite: penyusunan sitasi dan daftar pustaka dalam format APA 7 dan IEEE.",
    ],
  },
  {
    title: "Akun Pengguna",
    paragraphs: [
      "Anda bertanggung jawab menjaga kerahasiaan kata sandi serta seluruh aktivitas yang terjadi pada akun Anda. Data yang didaftarkan harus benar dan dapat dihubungi, khususnya email dan nomor WhatsApp yang dipakai untuk mengirim hasil pemeriksaan.",
    ],
  },
  {
    title: "Dokumen yang Diunggah",
    bullets: [
      "Dokumen maksimal 25MB dengan panjang 250 sampai 25.000 kata, dalam format PDF, DOC, DOCX, atau TXT.",
      "Anda menjamin memiliki hak atas dokumen yang diunggah dan tidak melanggar hak pihak lain.",
      "Dokumen yang memuat konten melanggar hukum atau menyinggung pihak ketiga dapat kami tolak tanpa pemberitahuan.",
    ],
  },
  {
    title: "Harga dan Pembayaran",
    paragraphs: [
      "Harga setiap layanan ditampilkan sebelum pembayaran dan dapat berubah sewaktu-waktu. Pesanan mulai diproses setelah pembayaran terkonfirmasi. Kode promo berlaku sesuai periode dan syarat yang menyertainya.",
    ],
  },
  {
    title: "Pengembalian Dana",
    paragraphs: [
      "Pengembalian dana hanya diberikan jika kegagalan proses disebabkan kesalahan sistem kami dan dokumen tidak pernah selesai diperiksa. Permintaan diajukan melalui kanal resmi customer service maksimal 7 hari setelah transaksi.",
    ],
  },
  {
    title: "Batasan Tanggung Jawab",
    paragraphs: [
      "Hasil pemeriksaan bersifat indikatif dan merupakan alat bantu, bukan keputusan akhir atas keaslian sebuah karya. Gleans tidak bertanggung jawab atas keputusan akademik, sanksi, atau kerugian yang timbul dari penggunaan hasil pemeriksaan.",
    ],
  },
  {
    title: "Penggunaan yang Dilarang",
    bullets: [
      "Mengakali, merekayasa balik, atau membebani sistem secara tidak wajar.",
      "Menjual kembali atau mendistribusikan hasil layanan tanpa izin tertulis dari kami.",
      "Menggunakan layanan untuk tindakan melanggar hukum atau melanggar aturan integritas akademik institusi Anda.",
    ],
  },
  {
    title: "Perubahan dan Kontak",
    paragraphs: [
      "Ketentuan ini dapat diperbarui sewaktu-waktu dan berlaku sejak dipublikasikan pada halaman ini. Untuk pertanyaan seputar ketentuan layanan, silakan hubungi kanal resmi customer service kami.",
    ],
  },
];

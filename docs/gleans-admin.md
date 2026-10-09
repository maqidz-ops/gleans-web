# Gleans Admin — UI demo

Dashboard baru tersedia di `/admin`, terpisah dari dashboard pengguna. Tujuh menu: Ringkasan, Pesanan, Pelanggan, Paket & Transaksi, Blog, Promosi, Pengaturan.

## Perilaku demo

- Data contoh disimpan lokal di browser dengan key `gleans:admin-demo:v1`.
- Pesanan memisahkan pembayaran, pemeriksaan, dan pengiriman laporan. Pesanan belum terbayar tidak dapat diproses; laporan terkirim memerlukan pemeriksaan selesai.
- Pesanan dan pelanggan ditampilkan dalam tabel dengan pencarian serta popup detail baca saja. Filter pesanan memisahkan pembayaran, pemeriksaan, dan laporan. Tidak ada akses edit pada kedua menu ini.
- Paket dapat ditambah, diedit, dan dinonaktifkan. Transaksi memiliki filter status dan keadaan kosong.
- Blog dan Promosi memakai tabel dengan pencarian, filter, preview, dan tombol edit. Unggulan artikel serta aktivasi promosi dapat diubah langsung dari tabel. Status promosi memperhitungkan tanggal mulai/selesai.
- Artikel memiliki slug unik, isi teks, status Draft/Terbit/Arsip, pilihan unggulan, dan preview.
- Promosi memiliki jenis Banner/Popup/Kode promo, jadwal, nominal diskon, status aktif, dan preview.
- Pengaturan memiliki tab Admin (daftar dan undangan demo), Aktivitas (log dan konfirmasi pengosongan), serta Media (unggah PNG/JPG/WebP/GIF maksimal 10 MB, salin tautan, hapus dengan konfirmasi). Media memakai IndexedDB terpisah; reset data admin tidak menghapus media. Form konfigurasi website sebelumnya belum ditampilkan dalam tab baru.
- Reset demo mengembalikan data contoh setelah konfirmasi. Dashboard pengguna memakai penyimpanan berbeda.

- Notifikasi di samping logo menampilkan pembayaran menunggu, hasil tersedia/kedaluwarsa, serta kendala pemeriksaan; klik membuka detail pesanan. Status dibaca disimpan lokal.
- Akses unduh Shield berakhir tepat 24 jam setelah pemeriksaan selesai, dengan contoh hasil aktif dan kedaluwarsa. Riwayat pembayaran/pesanan tetap tampil. Kegagalan kuota API dan antrean karena batas request merupakan skenario demo, bukan respons API nyata.
- Demo pengguna membatasi unduh laporan berdasarkan waktu selesai. Penghapusan dokumen sebenarnya memerlukan penyimpanan server dan proses retensi otomatis; demo tidak menyimpan berkas pemeriksaan.

## Batas implementasi

Ini prototipe UI lokal, bukan panel operasional produksi. `/admin` belum dilindungi autentikasi atau hak akses. Data contoh tidak mengambil data pelanggan nyata. Mengubah status pembayaran atau refund hanya mengubah data demo; tidak mentransfer uang atau menyesuaikan saldo otomatis. Status Terbit dan promosi aktif tidak mempublikasikan konten ke website. Media yang diunggah tersimpan lokal di browser, belum terhubung ke artikel atau promosi publik. Undangan tidak mengirim email atau memberi hak akses nyata. Belum ada unggah dokumen, editor rich text, integrasi pemeriksaan, pengiriman laporan, atau statistik tayangan.

Tahap berikutnya adalah autentikasi dan otorisasi server, database, penyimpanan media/dokumen terbatas, integrasi CMS dengan halaman publik, serta integrasi pembayaran dan pemeriksaan. Artikel MDX lama tetap dikelola melalui repository sampai migrasi CMS dilakukan.

## Validasi

`npm run test:admin` memeriksa perubahan saldo/kuota, status pesanan, keunikan slug, jadwal promosi, dan serialisasi state. `npm run build` memeriksa kompilasi, tipe, dan seluruh route.

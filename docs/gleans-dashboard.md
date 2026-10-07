# Dashboard pengguna Gleans

Dashboard saat ini adalah prototipe UI dengan simulasi lokal, bukan autentikasi atau transaksi nyata. Akses melalui `/dashboard` atau tombol **Coba dashboard** di halaman masuk. Login biasa belum membuat sesi.

Menu: Ringkasan, Pesanan, Paket & Saldo, Pengaturan. Simulasi mencakup top-up, pembelian paket, pesanan Shield, pembayaran gagal/kedaluwarsa, proses pemeriksaan, laporan contoh, dan pengembalian pembayaran. Kuota demo tidak kedaluwarsa. QRIS demo tidak membuka payment gateway; refund QRIS dicatat kembali ke metode asal dan tidak menambah saldo.

Data contoh tersimpan dalam `gleans:dashboard-demo:v1`. Reset hanya memulihkan data dashboard demo; pilihan akun kosong mengosongkan saldo, kuota, pesanan, dan transaksi. Data Cite tidak dibaca atau diubah. File tetap diproses di browser. Sesi demo aktif ketika dashboard dibuka dan tersimpan terpisah pada `gleans:dashboard-demo-session:v1`. Navbar website menampilkan profil yang sama, dengan akses dashboard dan pengaturan. Keluar demo menghapus penanda sesi dan mengembalikan tombol Daftar tanpa menghapus data contoh. Perubahan profil dan sesi tersinkron antartab pada origin yang sama. Gunakan identitas fiktif untuk profil demo.

`DashboardDataProvider` memisahkan data dan tindakan dari tampilan. Katalog paket di `src/lib/plans.ts` digunakan homepage dan dashboard. Reducer transaksi mengabaikan ID pembayaran yang sudah diproses, memvalidasi saldo/kuota, dan mengembalikan pembayaran sekali ketika pemeriksaan gagal.

Tahap berikutnya membutuhkan autentikasi dan proteksi server, isolasi data berdasarkan pengguna, penyimpanan dokumen/laporan terbatas, validasi harga server, konfirmasi pembayaran, dan pemrosesan Shield. Jangan menganggap penyimpanan demo sebagai rekening saldo atau hak akses akun.

Validasi: `npm run test:dashboard`, lint, TypeScript, build, dan pemeriksaan browser desktop/mobile.

# Auth Gleans dengan InsForge

Project backend: `gleans-auth`, region `ap-southeast`.
Dashboard: https://insforge.dev/dashboard/project/1223bd66-3bee-4d66-8ba0-5290020cab6b

## Menjalankan lokal

1. Gunakan Node.js 22 dan pnpm. Jalankan `pnpm install --frozen-lockfile`.
2. Salin `.env.example` ke `.env.local` dan isi URL backend serta anon key dari dashboard InsForge. Koneksi CLI lokal sudah tersimpan dalam `.insforge/project.json` (diabaikan Git).
3. Untuk mengambil anon key: `npx @insforge/cli secrets get ANON_KEY`. Jangan gunakan admin/API key sebagai variabel publik.
4. Jalankan `pnpm dev`. URL aplikasi lokal: `http://localhost:3000`.

## Deployment pada hosting web yang sudah digunakan

Tambahkan tiga variabel berikut pada hosting, lalu rebuild:

- `NEXT_PUBLIC_INSFORGE_URL`: `https://q7e5p7p6.ap-southeast.insforge.app`
- `NEXT_PUBLIC_INSFORGE_ANON_KEY`: anon key project dari dashboard.
- `NEXT_PUBLIC_APP_URL`: `https://gleans.my.id`

`NEXT_PUBLIC_SITE_URL` dapat tetap `https://gleans.my.id`. `.env.local` tidak dikirim ke GitHub. Semua variabel `NEXT_PUBLIC_*` dimasukkan saat build.

Konfigurasi backend telah diterapkan melalui `insforge.toml`: verifikasi email wajib, pendaftaran terbuka, password minimal 8 karakter, verifikasi/reset menggunakan tautan. Redirect localhost dan domain di atas sudah diizinkan. Jika domain hosting berbeda, tambahkan URL `/verifikasi-email` dan `/reset-kata-sandi` ke TOML, jalankan `npx @insforge/cli config plan`, lalu `config apply --auto-approve`. Untuk perubahan backend produksi berikutnya, gunakan branch backend terlebih dahulu.

## Perilaku

- `/masuk`, `/daftar`, `/lupa-kata-sandi`, `/verifikasi-email`, `/reset-kata-sandi` tersedia untuk pengunjung.
- `/akun` memvalidasi pengguna di server dan mengarahkan tamu ke `/masuk`.
- Semua fitur publik tetap tersedia tanpa login.
- Mutasi auth menggunakan Server Actions, bukan SDK browser. SDK SSR mengelola cookie access token dan refresh token `httpOnly`.
- Middleware memperbarui sesi sebelum Server Components membaca cookie. `/api/auth/refresh` menangani refresh browser.
- Checkbox simulasi “Ingat saya” dihapus: sesi mengikuti masa berlaku token InsForge.

## Verifikasi

Jalankan `pnpm lint`, `pnpm test:auth`, dan `pnpm build`. Tes sesi memakai backend tiruan dan memeriksa cookie, token yang tidak bocor dari aksi auth, refresh, verifikasi kode, reset, logout, serta token kedaluwarsa.

Uji penerimaan dengan inbox yang Anda miliki setelah deployment:

1. Daftar; pastikan belum dapat masuk sebelum verifikasi.
2. Buka tautan verifikasi, masuk, dan lihat email di `/akun`.
3. Refresh halaman; sesi tetap aktif. Keluar; `/akun` kembali mengarah ke login.
4. Minta reset password, buka tautan email, ganti password, dan masuk kembali.
5. Ulangi dengan tautan kedaluwarsa serta password salah; pastikan pesan kesalahan terlihat.

Pengiriman dan keberhasilan tautan email end-to-end harus dikonfirmasi dengan inbox nyata. Tes otomatis tidak mengirim email.

# Gleans workspace

Aplikasi Gleans berada di `apps/web`. Website publik, dashboard pengguna, admin, dan UI pembayaran tetap satu aplikasi Next.js.

```text
apps/web/
  src/app/            # URL dan layout Next.js
  src/features/       # auth, admin, dashboard, orders, payments, citation, file, blog
  src/components/     # home dan layout bersama aplikasi
  src/config/         # site, legal, assets
  content/            # blog MDX
  public/             # gambar, font, worker dokumen
  scripts/            # build worker dan tes aplikasi
  tests/              # fixture dokumen
packages/
  ui/                 # komponen React dan utilities UI
  schemas/            # validasi form auth
  insforge/           # ekspor SDK server dan browser terpisah
  citation/           # format, resolusi metadata, ekspor sitasi
  file-tools/         # pengolahan dokumen di browser
  typescript-config/  # konfigurasi tipe bersama
```

## Pengembangan

Gunakan Node.js 22 dan pnpm 11.25.0. Salin `.env.example` root ke `apps/web/.env.local` dan isi konfigurasi lokal. Jalankan dari root:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Panduan lokasi environment, konfigurasi hosting, dan batas paket: [docs/monorepo.md](docs/monorepo.md).

Restrukturisasi ini mempertahankan perilaku aplikasi yang ada. Dashboard masih demo; UI pembayaran belum terhubung DOKU; dashboard pengguna dilindungi sesi InsForge dan memakai identitas akun asli. Pesanan, saldo, dan pembayaran masih data demo per akun. Otorisasi admin tetap diperiksa di server aplikasi, bukan di paket SDK bersama.

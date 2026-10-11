# Struktur workspace Gleans

Satu aplikasi Next.js berada di `apps/web`. Website publik, dashboard, dan admin tetap memakai URL yang sama. Kode UI fitur berada di `apps/web/src/features`; komponen layout/home dan konfigurasi website tetap khusus aplikasi.

Paket bersama: `@gleans/ui`, `@gleans/citation`, `@gleans/file-tools`, `@gleans/schemas`, dan `@gleans/insforge`. Paket InsForge memiliki entry point server dan browser terpisah. Kebijakan akses admin tetap berada di aplikasi. Auth pengguna dari branch terpisah belum digabung dalam restrukturisasi ini.

## Menjalankan

Gunakan Node.js 22 dan pnpm 11.25.0. Dari root: `pnpm install --frozen-lockfile`, kemudian `pnpm dev`. Port default tetap 3000. Preview terpisah: `pnpm --filter @gleans/web exec next dev --turbopack --port 3104`.

Environment lokal berada di `apps/web/.env.local`; contoh variabel berada di `.env.example` root. Jangan commit credential. `.insforge/project.json` tetap berada di root dan tidak dipindah ke paket.

## Hosting dan checks

Root directory aplikasi pada hosting: `apps/web`; install workspace dari root repository, build dengan `pnpm --filter @gleans/web build`. Pertahankan variabel environment dan redirect auth yang ada. Blog dibaca dari `apps/web/content/blog`. Worker DOC dibangun ke `apps/web/public/workers` sebelum dev/build.

Jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` dari root. Tes aplikasi berada di `apps/web/scripts` dan fixture di `apps/web/tests`; skrip citation/file membaca sumber paket workspace.

Aplikasi admin/API terpisah, repository database, webhook DOKU, cron, dan pengiriman notifikasi belum dibuat. Turborepo belum diperlukan untuk satu aplikasi; pnpm mengatur workspace dan urutan pemeriksaan paket.

## Referensi

- [pnpm workspace](https://pnpm.io/workspaces): paket lokal memakai `workspace:*` dan satu lockfile root.
- [Next.js transpilePackages](https://nextjs.org/docs/pages/api-reference/config/next-config-js/transpilePackages): sumber TypeScript paket lokal dikompilasi oleh aplikasi Next.js.

Perubahan ini disiapkan pada worktree `monorepo-layout`, branch `codex/monorepo-layout`, berdasarkan checkout admin dan UI dashboard/pembayaran terbaru yang sudah tersedia lokal. Preview lama tidak dipindah. Integrasi auth pengguna dan DOKU dilanjutkan pada pekerjaan terpisah.

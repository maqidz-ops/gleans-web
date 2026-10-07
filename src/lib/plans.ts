export const PLANS = [
  { id: "starter", name: "Starter", price: 45_000, normal: 85_000, checks: 5, blurb: "Pas untuk tugas kuliah dan makalah rutin." },
  { id: "standart", name: "Standart", price: 85_000, normal: 165_000, checks: 10, blurb: "Untuk proposal, laporan, dan tugas yang lebih panjang." },
  { id: "premium", name: "Premium", price: 165_000, normal: 250_000, checks: 25, blurb: "Hemat untuk skripsi, tesis, dan kelompok." },
] as const;
export const SHIELD_PRICE = 10_000;

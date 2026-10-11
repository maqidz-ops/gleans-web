import { z } from "zod";
export const ADMIN_STORAGE_KEY = "gleans:admin-demo:v1";
export const modules = ["pesanan", "pelanggan", "paket-transaksi", "blog", "promosi", "pengaturan"] as const;
export type Module = typeof modules[number];
const money = z.number().int().min(0).max(1_000_000_000);
const text = z.string().trim().min(1).max(200);
export const customerSchema = z.object({ id: text, name: text, email: z.string().email(), whatsapp: z.string().max(25), balance: money, quota: z.number().int().min(0).max(100000) });
export const orderSchema = z.object({ id: text, customerId: text, document: text, amount: money, payment: z.enum(["Menunggu", "Berhasil", "Kedaluwarsa", "Refund"]), processing: z.enum(["Belum diproses", "Antre", "Diproses", "Selesai", "Gagal"]), delivery: z.enum(["Belum dikirim", "Terkirim", "Gagal dikirim"]), note: z.string().max(2000), completedAt: z.string().datetime().optional(), failureReason: z.enum(["api_quota", "rate_limit", "timeout", "invalid_document"]).optional(), date: text });
export const planSchema = z.object({ id: text, name: text, price: money, quota: z.number().int().min(1).max(100000), active: z.boolean() });
export const ADMIN_BLOG_CATEGORIES = ["Tutorial", "Tips & Trik", "Edukasi", "Kampus"] as const;
export const blogSchema = z.object({ id: text, title: text, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug memakai huruf kecil, angka, dan tanda hubung."), category: z.enum(ADMIN_BLOG_CATEGORIES).default("Edukasi"), summary: z.string().max(500), content: z.string().max(30000), status: z.enum(["Draft", "Terbit", "Terjadwal", "Arsip"]), author: z.string().trim().max(200).default("Tim Gleans"), coverId: z.string().default(""), coverAlt: z.string().max(200).default(""), publishAt: z.string().datetime().optional(), featured: z.boolean() });
export const promoSchema = z.object({ id: text, name: text, title: text, type: z.enum(["Banner", "Popup", "Kode promo"]), code: z.string().max(40), discount: money, start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), active: z.boolean() });
export const adminMemberSchema = z.object({id:text,name:text,email:z.string().email(),role:z.enum(["Owner","Editor","Operator"]),status:z.enum(["Aktif","Diundang","Dicabut"])});
export const defaultAdmins = [{id:"ADMIN-001",name:"Admin Demo",email:"owner@example.com",role:"Owner" as const,status:"Aktif" as const}];
export const adminSchema = z.object({ demoVersion:z.number().default(1), admins:z.array(adminMemberSchema).default(defaultAdmins), customers: z.array(customerSchema), orders: z.array(orderSchema), plans: z.array(planSchema), blogs: z.array(blogSchema), promos: z.array(promoSchema), transactions: z.array(z.object({ id: text, customerId: text, title: text, amount: z.number().int(), status: z.enum(["Berhasil", "Menunggu", "Refund"]), date: text })), settings: z.object({ email: z.string().email(), whatsapp: text, maxMb: z.number().int().min(1).max(100), minWords: z.number().int().min(1), maxWords: z.number().int().min(1), shieldPrice: money, shield: z.boolean(), cite: z.boolean(), file: z.boolean() }), activity: z.array(z.object({ id: text, action: z.string().min(1).max(2200), actor:z.string().default("Gleans"), object:z.string().default("Demo admin"), at: z.string().datetime() })) });
export type AdminState = z.infer<typeof adminSchema>;
export type Collection = "customers" | "orders" | "plans" | "blogs" | "promos";
export type RecordData = AdminState[Collection][number];
export function initialAdmin(now = Date.now()): AdminState {
  const stamp = (hours: number) => new Date(Math.floor(now / 60000) * 60000 - hours * 3600000).toISOString();
  return {
    demoVersion: 3,
    admins: defaultAdmins.map(a=>({...a})),
    customers: [{ id: "USR-001", name: "Alya Putri", email: "alya@example.com", whatsapp: "081234567890", balance: 50000, quota: 2 }, { id: "USR-002", name: "Raka Pratama", email: "raka@example.com", whatsapp: "081234567891", balance: 25000, quota: 5 }, { id: "USR-003", name: "Nadia Safitri", email: "nadia@example.com", whatsapp: "081234567892", balance: 0, quota: 0 }],
    orders: [{ id: "SH-1001", customerId: "USR-001", document: "Proposal penelitian.pdf", amount: 10000, payment: "Berhasil", processing: "Antre", delivery: "Belum dikirim", note: "", date: "2026-10-08" }, { id: "SH-1002", customerId: "USR-002", document: "Makalah metodologi.docx", amount: 10000, payment: "Berhasil", processing: "Selesai", delivery: "Terkirim", note: "", completedAt: stamp(4), date: "2026-10-08" }, { id: "SH-1003", customerId: "USR-003", document: "Bab pendahuluan.pdf", amount: 10000, payment: "Menunggu", processing: "Belum diproses", delivery: "Belum dikirim", note: "", date: "2026-10-07" }, { id: "SH-1004", customerId: "USR-001", document: "Literatur penelitian.pdf", amount: 10000, payment: "Berhasil", processing: "Gagal", delivery: "Belum dikirim", failureReason: "timeout", note: "Layanan GPTZero tidak merespons dalam batas waktu (skenario demo). Hasil belum tersedia. Periksa kondisi layanan sebelum mencoba ulang.", date: "2026-10-07" }, { id: "SH-1005", customerId: "USR-001", document: "Esai akademik.pdf", amount: 10000, payment: "Berhasil", processing: "Selesai", delivery: "Terkirim", note: "Masa unduh 24 jam telah berakhir. Dokumen dan laporan tidak lagi tersedia.", completedAt: stamp(26), date: "2026-10-07" }, { id: "SH-1006", customerId: "USR-003", document: "Tinjauan pustaka.docx", amount: 10000, payment: "Berhasil", processing: "Antre", delivery: "Belum dikirim", failureReason: "rate_limit", note: "Batas request GPTZero sementara tercapai (skenario demo). Tetap di antrean untuk dicoba ulang setelah jeda; masa unduh belum dimulai.", date: "2026-10-09" }],
    plans: [{ id: "starter", name: "Starter", price: 45000, quota: 5, active: true }, { id: "standart", name: "Standart", price: 85000, quota: 10, active: true }, { id: "premium", name: "Premium", price: 165000, quota: 25, active: true }],
    blogs: [{ id: "BLOG-001", title: "Menyusun referensi akademik dengan lebih mudah", slug: "menyusun-referensi-akademik", category: "Tutorial", summary: "Langkah sederhana untuk mengelola sumber tulisanmu.", content: "Mulai dengan mencatat sumber yang digunakan. Periksa penulis, tahun, judul, dan DOI sebelum menyusun daftar pustaka.", status: "Draft", author: "Tim Gleans", coverId: "", coverAlt: "", featured: false }, { id: "BLOG-002", title: "Persiapan dokumen sebelum pemeriksaan", slug: "persiapan-dokumen", category: "Tips & Trik", summary: "Pastikan dokumen siap diperiksa.", content: "Periksa format dan kelengkapan dokumen sebelum mengirim pesanan.", status: "Terbit", author: "Tim Gleans", coverId: "", coverAlt: "", featured: true }],
    promos: [{ id: "PROMO-001", name: "Promo mahasiswa Oktober", title: "Mulai tulisanmu bersama Gleans", type: "Banner", code: "", discount: 0, start: "2026-10-01", end: "2026-10-31", active: true }, { id: "PROMO-002", name: "Kode sambutan", title: "Diskon pemeriksaan pertama", type: "Kode promo", code: "GLEANSBARU", discount: 2000, start: "2026-10-01", end: "2026-10-31", active: false }],
    transactions: [{ id: "TX-001", customerId: "USR-001", title: "Top-up saldo", amount: 50000, status: "Berhasil", date: "2026-10-08" }, { id: "TX-002", customerId: "USR-002", title: "Paket Starter", amount: 45000, status: "Berhasil", date: "2026-10-08" }, { id: "TX-003", customerId: "USR-003", title: "Pembayaran Shield", amount: 10000, status: "Menunggu", date: "2026-10-07" }],
    settings: { email: "team@gleans.my.id", whatsapp: "6281998096254", maxMb: 25, minWords: 250, maxWords: 25000, shieldPrice: 10000, shield: true, cite: true, file: true },
    activity: [{ id: "ACT-001", action: "Data contoh admin disiapkan", actor:"Gleans", object:"Demo admin", at: "2026-10-08T01:00:00.000Z" }],
  };
}
export function saveAdminRecord(state: AdminState, collection: Collection, record: RecordData, reason = ""): AdminState {
  const schemas = { customers: customerSchema, orders: orderSchema, plans: planSchema, blogs: blogSchema, promos: promoSchema };
  const parsed = schemas[collection].parse(record);
  if(reason.trim().length > 1000) throw new Error("Alasan maksimal 1000 karakter.");
  if (collection === "customers") {
    const next = customerSchema.parse(parsed); const old = state.customers.find(c => c.id === next.id);
    if (old && (old.balance !== next.balance || old.quota !== next.quota) && reason.trim().length < 5) throw new Error("Tuliskan alasan perubahan saldo atau kuota (minimal 5 karakter).");
  }
  if (collection === "blogs") { const blog = blogSchema.parse(parsed); if(blog.status === "Terjadwal" && (!blog.publishAt || Date.parse(blog.publishAt) <= Date.now())) throw new Error("Pilih waktu publikasi mendatang untuk menjadwalkan artikel."); }
  if (collection === "blogs" && state.blogs.some(b => b.id !== parsed.id && b.slug === blogSchema.parse(parsed).slug)) throw new Error("Slug artikel sudah digunakan.");
  if (collection === "promos") { const promo = promoSchema.parse(parsed); if (promo.end < promo.start) throw new Error("Tanggal selesai harus setelah tanggal mulai."); if (promo.type === "Kode promo" && !promo.code.trim()) throw new Error("Isi kode promo."); }
  if (collection === "orders") { const order = orderSchema.parse(parsed); if (!state.customers.some(c => c.id === order.customerId)) throw new Error("Pelanggan tidak ditemukan."); if (!["Belum diproses", "Gagal"].includes(order.processing) && order.payment !== "Berhasil") throw new Error("Pesanan harus terbayar sebelum pemeriksaan."); if (order.delivery === "Terkirim" && order.processing !== "Selesai") throw new Error("Laporan hanya bisa terkirim setelah pemeriksaan selesai."); }
  const items = state[collection];
  const next = { ...state, [collection]: items.some(x => x.id === parsed.id) ? items.map(x => x.id === parsed.id ? parsed : x) : [parsed, ...items], activity: [{ id: crypto.randomUUID(), action: `Memperbarui${reason.trim() ? `: ${reason.trim()}` : ""}`, actor:"Gleans", object:parsed.id, at: new Date().toISOString() }, ...state.activity].slice(0,100) };
  return adminSchema.parse(next);
}

export function inviteDemoAdmin(state:AdminState,member:{name:string;email:string;role:"Editor"|"Operator"}):AdminState {
 z.enum(["Editor","Operator"]).parse(member.role);
 const parsed=adminMemberSchema.parse({...member,id:crypto.randomUUID(),status:"Diundang"});
 const existing=state.admins.find(a=>a.email.toLowerCase()===parsed.email.toLowerCase());
 if(existing && existing.status!=="Dicabut")throw new Error("Email sudah ada dalam daftar admin.");
 if(existing) parsed.id=existing.id;
 return adminSchema.parse({...state,admins:existing?state.admins.map(a=>a.id===existing.id?parsed:a):[...state.admins,parsed],activity:[{id:crypto.randomUUID(),action:"Membuat undangan demo",actor:"Gleans",object:parsed.email,at:new Date().toISOString()},...state.activity].slice(0,100)});
}

export function upgradeAdminDemo(state: AdminState): AdminState {
  if (state.demoVersion >= 3) return state;
  const samples = initialAdmin();
  return adminSchema.parse({ ...state, demoVersion: 3, orders: [
    ...state.orders.map(order => ({ ...order,
      ...(order.processing === "Selesai" && !order.completedAt ? { completedAt: order.id === "SH-1002" ? samples.orders.find(o => o.id === order.id)!.completedAt : `${order.date}T08:00:00.000Z` } : {}),
      ...(order.id === "SH-1004" && order.processing === "Gagal" ? { failureReason: "timeout", note: samples.orders.find(o => o.id === order.id)!.note } : {}),
    })),
    ...samples.orders.filter(o => ["SH-1005", "SH-1006"].includes(o.id) && !state.orders.some(old => old.id === o.id)),
  ] });
}

export function revokeDemoAdmin(state: AdminState, id: string): AdminState {
  const member = state.admins.find(a => a.id === id);
  if (!member) throw new Error("Admin tidak ditemukan.");
  if (member.role === "Owner") throw new Error("Akses Owner tidak dapat dicabut.");
  if (member.status === "Dicabut") return state;
  return adminSchema.parse({ ...state,
    admins: state.admins.map(a => a.id === id ? { ...a, status: "Dicabut" } : a),
    activity: [{ id: crypto.randomUUID(), action: member.status === "Diundang" ? "Membatalkan undangan demo" : "Mencabut akses admin demo", actor: "Gleans", object: member.email, at: new Date().toISOString() }, ...state.activity].slice(0, 100),
  });
}

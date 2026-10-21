export async function uploadPaymentFile(file: File, purpose: "document" | "report" = "document", orderId?: string): Promise<string> {
  const prepared = await fetch("/api/payments/uploads", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, bytes: file.size, purpose, ...(orderId ? { orderId } : {}) }) });
  const upload = await prepared.json();
  if (!prepared.ok) throw new Error(upload.error || "Unggahan belum dapat disiapkan.");
  const form = new FormData();
  for (const [key, value] of Object.entries(upload.fields)) form.append(key, String(value));
  form.append("file", file);
  if (!(await fetch(upload.uploadUrl, { method: "POST", body: form })).ok) throw new Error("Dokumen belum dapat diunggah. Silakan coba kembali.");
  const confirmed = await fetch(`/api/payments/uploads/${encodeURIComponent(upload.ticket)}`, { method: "POST", credentials: "same-origin" });
  const result = await confirmed.json();
  if (!confirmed.ok) throw new Error(result.error || "Unggahan belum dapat dikonfirmasi.");
  return upload.ticket;
}

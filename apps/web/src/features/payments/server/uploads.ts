import "server-only";
import { paymentAdmin } from "./repository";
import { PAYMENT_DOCUMENT_BUCKET } from "../types";
export type UploadTicket = { id: string; guest_hash: string; owner_id: string | null; purpose: "document" | "report"; order_id: string | null; document_name: string; staging_key: string; final_key: string; document_url: string | null; bytes: number; content_type: string; confirm_url: string; state: string; expires_at: string };
export async function findUpload(id: string) {
  const { data, error } = await paymentAdmin().database.from("shield_upload_tickets").select("id,guest_hash,owner_id,purpose,order_id,document_name,staging_key,final_key,document_url,bytes,content_type,confirm_url,state,expires_at").eq("id", id).maybeSingle();
  if (error) throw new Error("UPLOAD_UNAVAILABLE");
  return data as UploadTicket | null;
}
export function validDocumentHeader(bytes: Uint8Array, name: string) {
  if (/\.pdf$/i.test(name)) return new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-");
  if (/\.docx$/i.test(name)) return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (/\.doc$/i.test(name)) return [0xd0, 0xcf, 0x11, 0xe0].every((value, index) => bytes[index] === value);
  return /\.txt$/i.test(name) && !bytes.slice(0, 1024).includes(0);
}
export async function freezeUpload(ticket: UploadTicket) {
  if (ticket.state === "confirmed") return;
  const admin = paymentAdmin();
  const { data: claimed, error } = await admin.database.from("shield_upload_tickets").update({ state: "freezing", claimed_at: new Date().toISOString() }).eq("id", ticket.id).eq("state", "issued").select("id");
  if (error || !claimed?.length) throw new Error("UPLOAD_BUSY");
  try {
    await admin.getHttpClient().post(ticket.confirm_url, { size: ticket.bytes, contentType: ticket.content_type });
    const bucket = admin.storage.from(PAYMENT_DOCUMENT_BUCKET);
    const { data: blob, error: readError } = await bucket.download(ticket.staging_key);
    if (readError || !blob || blob.size !== ticket.bytes) throw new Error("INVALID_UPLOAD");
    if (!validDocumentHeader(new Uint8Array(await blob.arrayBuffer()), ticket.document_name)) throw new Error("INVALID_DOCUMENT_FORMAT");
    // Seal a snapshot at an unshared key. Reusing the presigned staging URL cannot alter an order/report.
    const { data: stored, error: saveError } = await bucket.upload(ticket.final_key, new File([blob], ticket.document_name, { type: ticket.content_type }));
    if (saveError || !stored) throw new Error("UPLOAD_UNAVAILABLE");
    const { error: confirmError } = await admin.database.from("shield_upload_tickets").update({ state: "confirmed", document_url: stored.url }).eq("id", ticket.id).eq("state", "freezing");
    if (confirmError) throw new Error("UPLOAD_UNAVAILABLE");
    await bucket.remove(ticket.staging_key); // Only this temporary object created by the upload is removed.
  } catch (error) {
    await admin.database.from("shield_upload_tickets").update({ state: "issued" }).eq("id", ticket.id).eq("state", "freezing");
    throw error;
  }
}

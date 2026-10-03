"use client";

import { useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, formatNumber, formatRupiah } from "@/lib/format";
import {
  ACCEPTED_FILES,
  LIMIT_LABEL,
  MAX_FILE_BYTES,
  PRICE_PER_DOCUMENT,
  type AppliedPromo,
  extractWordCount,
  resolvePromo,
  validateFile,
  validateWords,
  whatsappSchema,
} from "@/lib/detection/order";
import { cn } from "@/lib/utils";

type Document = { file: File; words: number };

export function OrderForm() {
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [reading, setReading] = useState(false);

  const subtotal = document ? PRICE_PER_DOCUMENT : 0;
  const discount = document ? (promo?.discount ?? 0) : 0;
  const total = subtotal - discount;

  async function acceptFile(file: File) {
    const fileError = validateFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setReading(true);
    try {
      const words = await extractWordCount(file);
      const wordError = validateWords(words);
      if (wordError) {
        toast.error(wordError);
        setDocument(null);
        return;
      }
      setDocument({ file, words });
      toast.success(`${file.name} siap diproses.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail.length < 180
          ? detail
          : "Gagal membaca dokumen. Coba unggah ulang atau pakai format lain.",
      );
    } finally {
      setReading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILES,
    maxFiles: 1,
    maxSize: MAX_FILE_BYTES,
    multiple: false,
    disabled: reading,
    onDrop: (accepted) => accepted[0] && acceptFile(accepted[0]),
    onDropRejected: () => toast.error("File ditolak. Pastikan format PDF, DOC, DOCX, atau TXT di bawah 25MB."),
  });

  function applyPromo() {
    const code = promoInput.trim();
    if (!code) {
      toast.error("Masukkan kode promo terlebih dahulu.");
      return;
    }
    const applied = resolvePromo(code, PRICE_PER_DOCUMENT);
    if (!applied) {
      setPromo(null);
      toast.error("Kode promo tidak ditemukan atau sudah kedaluwarsa.");
      return;
    }
    setPromo(applied);
    toast.success(`Kode ${applied.code} dipakai. ${applied.label}.`);
  }

  function handlePay() {
    const parsed = whatsappSchema.safeParse(whatsapp);
    if (!parsed.success) {
      setWhatsappError(parsed.error.issues[0].message);
      return;
    }
    setWhatsappError(null);
    if (!document) {
      toast.error("Unggah dokumen yang mau diperiksa.");
      return;
    }
    toast.info("Halaman pembayaran segera hadir. Pesananmu belum dikirim.");
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_380px]">
      <section className="flex min-w-0 flex-col gap-6 rounded-[24px] border bg-white p-4">
        <header className="flex min-w-0 items-center gap-4">
          <span className="bg-surface flex size-12 shrink-0 items-center justify-center rounded-[12px]">
            <Image src="/images/icon-document.png" alt="" width={20} height={20} className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-lg font-semibold">Upload Dokumen</h2>
            <p className="text-muted-foreground text-sm">{LIMIT_LABEL}</p>
          </div>
        </header>

        <Field label="No. WhatsApp" htmlFor="whatsapp" error={whatsappError}>
          <div className="relative">
            <Image
              src="/images/icon-phone.png"
              alt=""
              width={20}
              height={20}
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2"
            />
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                setWhatsappError(null);
              }}
              aria-invalid={whatsappError ? true : undefined}
              placeholder="Masukkan No. Telepon"
              className="h-12 rounded-full pr-5 pl-13 md:text-base"
            />
          </div>
        </Field>

        <Field label="Kode Promo" htmlFor="promo">
          <div className="relative">
            <Image
              src="/images/icon-ticket.png"
              alt=""
              width={20}
              height={20}
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2"
            />
            <Input
              id="promo"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value);
                setPromo(null);
              }}
              placeholder="Masukkan Kode Promo"
              className="h-12 rounded-full pr-32 pl-13 text-sm md:text-base"
            />
            <Button
              type="button"
              size="pill-sm"
              onClick={applyPromo}
              className="absolute top-1/2 right-1 w-[104px] -translate-y-1/2 text-xs font-normal sm:text-sm"
            >
              Gunakan
            </Button>
          </div>
        </Field>

        <Field label="Upload File">
          <div
            {...getRootProps()}
            className={cn(
              "bg-surface flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-border p-4 text-center transition-colors sm:min-h-[200px] lg:min-h-[240px]",
              isDragActive && "border-primary bg-accent",
              reading && "cursor-wait opacity-70",
            )}
          >
            <input {...getInputProps()} />
            <span className="flex size-12 items-center justify-center rounded-xl bg-white">
              {reading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Image src="/images/icon-upload.png" alt="" width={20} height={20} className="size-5" />
              )}
            </span>
            <div className="flex w-full min-w-0 flex-col gap-1">
              <p className="truncate font-semibold">
                {reading ? "Membaca dokumen..." : document ? document.file.name : "Upload File"}
              </p>
              <p className="text-muted-foreground text-sm">
                {document && !reading
                  ? `${formatBytes(document.file.size)} • ${formatNumber(document.words)} Kata`
                  : "PDF, DOCS, DOC dan TXT"}
              </p>
            </div>
          </div>
        </Field>
      </section>

      <section className="flex min-w-0 flex-col gap-6 rounded-[24px] border bg-white p-4">
        <h2 className="text-xl font-semibold">Ringkasan Pesanan</h2>

        <div className="flex-1">
          {document ? (
            <div className="flex min-w-0 items-start gap-3">
              <span className="bg-surface flex size-12 shrink-0 items-center justify-center rounded-[12px]">
                <Image src="/images/icon-document.png" alt="" width={20} height={20} className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate font-semibold">{document.file.name}</p>
                <p className="text-muted-foreground text-sm break-words">
                  {formatBytes(document.file.size)} • {formatNumber(document.words)} Kata
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Hapus dokumen"
                onClick={() => setDocument(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada dokumen. Unggah file untuk melihat rinciannya.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="text-primary flex items-center justify-between">
              <span>Promo {promo?.code}</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold">
            <span>Total Pembayaran</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <Button
            type="button"
            size="pill"
            onClick={handlePay}
            disabled={!document || reading}
            className="w-full font-normal disabled:opacity-100"
          >
            Bayar Sekarang
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-medium uppercase">
          {label}
        </label>
      ) : (
        <p className="text-xs font-medium uppercase">{label}</p>
      )}
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

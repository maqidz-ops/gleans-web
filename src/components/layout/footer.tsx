import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CONTACT } from "@/lib/site";

const MENU = [
  { label: "Beranda", href: "/" },
  { label: "Cek Pesanan", href: "/cek-pesanan" },
  { label: "Blog & Berita", href: "/blog" },
  { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
  { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
];

export function Footer() {
  return (
    <footer id="kontak" className="bg-surface">
      <div className="container-page flex flex-col gap-12 py-12 md:py-14 lg:gap-[120px] lg:py-[60px]">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex max-w-[400px] flex-col gap-6">
            <Logo className="h-10 w-fit" />
            <p className="text-muted-foreground">
              Gleans adalah platform all-in-one yang mempermudah mahasiswa menyusun penulisan akademik secara
              praktis, cepat, dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <FooterColumn title="MENU UTAMA">
              {MENU.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </FooterColumn>
            <FooterColumn title="KONTAK KAMI">
              <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="footer-contact">
                <ContactIcon src="/images/icon-call.png" />
                {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="footer-contact">
                <ContactIcon src="/images/icon-sms.png" />
                {CONTACT.email}
              </a>
              <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" className="footer-contact">
                <ContactIcon src="/images/icon-instagram.png" />
                {CONTACT.instagram}
              </a>
            </FooterColumn>
          </div>
        </div>

        <p className="text-muted-foreground text-sm md:text-base">
          © {new Date().getFullYear()} Gleans. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-4 font-semibold">{title}</h3>
      <ul className="flex flex-col gap-4 [&_.footer-contact]:flex [&_.footer-contact]:items-center [&_.footer-contact]:gap-2 [&_.footer-contact]:text-muted-foreground [&_.footer-contact:hover]:text-primary">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </div>
  );
}

function ContactIcon({ src }: { src: string }) {
  return <Image src={src} alt="" width={20} height={20} className="size-5 shrink-0" />;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">
      {children}
    </Link>
  );
}

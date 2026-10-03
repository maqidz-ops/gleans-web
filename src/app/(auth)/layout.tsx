import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ASSETS } from "@/lib/assets";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <div className="flex flex-1 flex-col px-5 py-6 md:px-8">
        <Link href="/" className="hover:text-primary inline-flex w-fit items-center gap-2 transition-colors">
          <ChevronLeft className="size-5" />
          Beranda
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
      <div className="bg-navy hidden flex-1 items-center justify-center p-10 lg:flex">
        <Image
          src={ASSETS.illustration}
          alt=""
          width={520}
          height={390}
          className="h-auto w-full max-w-[520px]"
          priority
        />
      </div>
    </div>
  );
}

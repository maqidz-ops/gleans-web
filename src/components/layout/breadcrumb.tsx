import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Beranda", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="border-b">
      <ol className="flex h-[52px] items-center gap-2 overflow-x-auto px-5 text-sm whitespace-nowrap md:px-8 lg:h-[60px] lg:px-4 lg:text-base">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.label} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="text-foreground/80 hover:text-primary">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate">
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import Image from "next/image";
import { LogoMark } from "@/components/brand/logo";
import type { PostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";

const CATEGORY_COVERS: Record<string, string> = {
  "Tips & Trik": "/images/blog-thumbnail-tips.jpg",
  Tutorial: "/images/blog-thumbnail-tutorial.jpg",
  Edukasi: "/images/blog-thumbnail-edukasi.jpg",
};

const PALETTES: Record<string, string> = {
  Kampus: "from-[#3a44f2] to-[#4cbeff]",
};

export function BlogCover({
  post,
  className,
  size = "card",
}: {
  post: Pick<PostMeta, "title" | "category" | "cover">;
  className?: string;
  size?: "card" | "hero";
}) {
  const src = post.cover ?? CATEGORY_COVERS[post.category];

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-surface", className)}>
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes="(min-width: 1024px) 372px, 100vw" />
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between bg-gradient-to-br p-5 text-white",
            size === "hero" && "p-8 md:p-12",
            PALETTES[post.category] ?? PALETTES.Kampus,
          )}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide uppercase backdrop-blur">
              {post.category}
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-white">
              <LogoMark className="h-5" />
            </span>
          </div>
          <p
            className={cn(
              "line-clamp-3 max-w-[90%] font-semibold leading-tight",
              size === "hero" ? "text-2xl md:text-4xl" : "text-lg",
            )}
          >
            {post.title}
          </p>
          <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full border-[18px] border-white/10" />
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  badge,
  as: Tag = "h2",
  inverted = false,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: { icon: string; label: string };
  as?: "h1" | "h2";
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {badge && (
        <p className={cn("flex items-center gap-2 text-sm font-medium tracking-wide", inverted ? "text-white" : "text-primary")}>
          <Image src={badge.icon} alt="" width={20} height={20} className="size-5" />
          {badge.label}
        </p>
      )}
      <Tag
        className={cn(
          "text-[32px] leading-[1.15] font-medium tracking-tight md:text-[40px] lg:text-[56px] lg:leading-[1.2]",
          inverted ? "text-white" : "text-black",
        )}
      >
        {title}
      </Tag>
      {description && <p className="text-muted-foreground max-w-2xl text-base">{description}</p>}
    </div>
  );
}

export function PageIntro({
  title,
  description,
  badge,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: { icon: string; label: string };
}) {
  return <SectionHeading as="h1" badge={badge} title={title} description={description} />;
}

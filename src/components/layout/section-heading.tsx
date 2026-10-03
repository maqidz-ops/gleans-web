import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  as: Tag = "h2",
  inverted = false,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  as?: "h1" | "h2";
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
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

export function PageIntro({ title, description }: { title: React.ReactNode; description?: React.ReactNode }) {
  return <SectionHeading as="h1" title={title} description={description} />;
}

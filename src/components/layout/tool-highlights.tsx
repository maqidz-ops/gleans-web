import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolHighlights({
  title,
  description = "Semua tools digital yang kamu butuhkan selama kuliah, dalam satu tempat.",
  items,
}: {
  title: string;
  description?: string;
  items: { title: string; body: string; step?: string }[];
}) {
  return (
    <section className="section-y">
      <div className="container-page flex flex-col gap-10 lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 className="text-[28px] leading-tight font-medium tracking-tight md:text-4xl lg:text-[40px]">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "flex min-h-[220px] flex-col justify-between gap-8 rounded-[24px] border bg-white p-4 lg:min-h-[276px]",
                i === 2 && "md:col-span-2 lg:col-span-1",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-[16px] bg-primary text-lg font-medium text-white">
                {item.step ?? <Tag className="size-6 text-white" />}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalDocument({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="flex flex-col gap-7 rounded-[24px] border bg-white p-5 md:p-8 lg:p-10">
      {sections.map((section, i) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">
            {i + 1}. {section.title}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="flex list-disc flex-col gap-1 pl-6">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

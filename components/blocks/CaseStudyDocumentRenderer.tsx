import { DocumentRenderer } from "@keystatic/core/renderer";
import type { DocumentRendererProps } from "@keystatic/core/renderer";

type Props = { document: DocumentRendererProps["document"] };

export default function CaseStudyDocumentRenderer({ document }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <DocumentRenderer
        document={document}
        renderers={{
          inline: {
            bold: ({ children }) => (
              <strong className="font-semibold text-[--color-text-primary]">{children}</strong>
            ),
            italic: ({ children }) => (
              <em className="font-display italic">{children}</em>
            ),
          },
          block: {
            paragraph: ({ children }) => (
              <p className="text-base text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[65ch]">
                {children}
              </p>
            ),
            heading: ({ level, children }) => {
              if (level === 2) {
                return (
                  <h2 className="font-display italic text-section-heading text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] mt-8 mb-4">
                    {children}
                  </h2>
                );
              }
              return (
                <h3 className="font-body font-semibold text-xl text-[--color-text-primary] leading-[--leading-snug] mt-6 mb-2">
                  {children}
                </h3>
              );
            },
            list: ({ type, children }) => {
              if (type === "ordered") {
                return (
                  <ol className="list-decimal pl-6 flex flex-col gap-1 text-[--color-text-secondary]">
                    {children}
                  </ol>
                );
              }
              return (
                <ul className="list-disc pl-6 flex flex-col gap-1 text-[--color-text-secondary]">
                  {children}
                </ul>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-[--color-border] pl-6 text-[--color-text-secondary] italic">
                {children}
              </blockquote>
            ),
          },
        }}
      />
    </div>
  );
}

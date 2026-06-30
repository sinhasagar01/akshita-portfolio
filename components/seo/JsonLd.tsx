/**
 * Renders a JSON-LD structured-data block. Invisible (a `<script>`), so it never affects
 * layout. App Router pattern — render inside a server component, not via `next/head`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is built from our own typed builders, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

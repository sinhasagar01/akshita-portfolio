"use client";

// Last-resort boundary: catches errors thrown by the ROOT layout itself, so it must
// render its own <html>/<body> (it replaces the root layout). Styled with inline brand
// values rather than token classes, because a root-layout failure means the app CSS
// cannot be relied on. Shown only in the rare case the shell itself throws.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF6EE",
          color: "#1c1813",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "13px",
            fontWeight: 600,
            color: "#9c4a2c",
            fontFamily: "system-ui, sans-serif",
            margin: 0,
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.9rem, 5vw, 2.75rem)",
            fontWeight: 400,
            lineHeight: 1.1,
            margin: "16px 0 0",
          }}
        >
          The site hit a snag.
        </h1>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "#6b5f52",
            maxWidth: "42ch",
            margin: "16px 0 0",
          }}
        >
          An unexpected error stopped the page from loading. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "36px",
            border: 0,
            cursor: "pointer",
            borderRadius: "9999px",
            background: "#bd5f3a",
            color: "#FBF6EE",
            padding: "12px 24px",
            fontSize: "0.95rem",
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

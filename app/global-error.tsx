"use client";

// Last-resort boundary: catches errors thrown by the ROOT layout itself, so it must
// render its own <html>/<body> (it replaces the root layout). Shown only in the rare case the
// shell itself throws.
//
// ⚠ ITS COLOUR LITERALS ARE NOT DEBT. THEY ARE THE ONLY CORRECT IMPLEMENTATION. DO NOT TOKENISE.
//
// This file renders WHEN THE APP HAS FAILED. The stylesheet may not have loaded, so the token
// layer may not exist — and `var(--color-ink-950)` that resolves to nothing leaves an INVISIBLE
// PAGE at exactly the moment someone needs to read it. Every other surface can assume the cascade;
// this one is what runs when that assumption is what broke.
//
// ⚠ AND IT IS THE INVERSE OF EVERY OTHER ENTRY ON THE THEME BOUNDARY LIST. The custom cursor and
// the process diagram's fills are excluded because they MUST NOT VARY. This is excluded because it
// CANNOT DEPEND ON ANYTHING THAT VARIES. Two different reasons, and only the second one gets worse
// the more correct the rest of the system becomes — a fully tokenised app is exactly the app whose
// error page must not use tokens.
//
// So a cool theme shows a warm error page. That is the trade, made deliberately, and it is the
// right side of it.
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

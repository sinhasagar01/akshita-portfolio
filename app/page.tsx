export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(2rem, 6vw, 6rem)",
        background: "var(--color-background)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--tracking-widest)",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "2rem",
        }}
      >
        Product Designer
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-5xl)",
          color: "var(--color-text-primary)",
          maxWidth: "18ch",
          marginBottom: "2rem",
        }}
      >
        Phase 0 scaffold is running.
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xl)",
          color: "var(--color-text-secondary)",
          lineHeight: "var(--leading-relaxed)",
          maxWidth: "48ch",
          marginBottom: "3rem",
        }}
      >
        Design tokens, fonts, and Keystatic are wired up. Phase 1 builds the
        real layout and motion baseline.
      </p>
      <a
        href="/keystatic"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "var(--color-accent)",
          color: "var(--color-cream-50)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--tracking-wide)",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        Open Keystatic dashboard
      </a>
    </main>
  );
}

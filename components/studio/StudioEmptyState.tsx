// GH-12 — the shared studio empty-state card (replaces four near-identical
// copies across the dashboard pages). In dev it deep-links into Keystatic as
// before. In production /keystatic is 404 by decision (the middleware guards
// it), so the card renders as a non-link with a note instead of sending the
// owner to a dead end. Server component, branches per build.
type Props = {
  /** Keystatic deep-link used in dev. */
  href: string;
  children: React.ReactNode;
};

const CARD_CLASS =
  "block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600";

export default function StudioEmptyState({ href, children }: Props) {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className={CARD_CLASS}>
        <p>{children}</p>
        <p className="mt-2 text-[11px] text-text-subtle">
          Content is added in dev through Keystatic.
        </p>
      </div>
    );
  }
  return (
    <a href={href} className={`${CARD_CLASS} hover:border-accent-500/40`}>
      {children}
    </a>
  );
}

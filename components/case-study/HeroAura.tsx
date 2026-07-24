/**
 * The behind-the-phones hero glow, per case study. A localized, always-on ambient
 * layer (unlike the cursor-follow CursorGlow it replaces on these heroes), sized to
 * the two-phone cluster and themed to the study. Pure markup — every colour, blur and
 * animation lives in `.hero-aura*` in globals.css; the motion respects reduced-motion
 * there. Decorative, so aria-hidden. Public-hero treatment only (mounted by HeroCover
 * when CaseStudyView passes a `heroGlow`); the studio canvas never sets one.
 *
 *  - "pulse"  (boAt Crest)  — a warm brand-red bloom breathing on a heartbeat cadence,
 *                             with a cool SpO₂ wink low-left. A living wearable.
 *  - "signal" (Elevate)     — a steel field with #2e1a47 status waves rippling outward.
 */
export default function HeroAura({ theme }: { theme: "pulse" | "signal" }) {
  return (
    <div className={`hero-aura hero-aura--${theme}`} aria-hidden="true">
      {theme === "pulse" ? (
        <>
          <span className="ha-wash" />
          <span className="ha-core" />
          <span className="ha-wink" />
        </>
      ) : (
        <>
          <span className="ha-field" />
          <span className="ha-core" />
          <span className="ha-ping" />
          <span className="ha-ping ha-ping--2" />
          <span className="ha-ping ha-ping--3" />
        </>
      )}
    </div>
  );
}

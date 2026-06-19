import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function ProcessSection(_props: Props) {
  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel className="mb-4">Process</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display italic text-[--text-2xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mb-12">
            from idea to design
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex justify-center">
            <ProcessFunnel />
          </div>
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}

const STAGES = [
  { n: "01", label: "Discover" },
  { n: "02", label: "Define" },
  { n: "03", label: "Design" },
  { n: "04", label: "Validate" },
] as const;

// Funnel: left wall (50,140)→(120,380), right wall (270,140)→(200,380)
// Each side narrows 70px over 240px of height.
function funnelEdges(y: number): { left: number; right: number } {
  const t = (y - 140) / 240;
  return { left: 50 + t * 70, right: 270 - t * 70 };
}

const STAGE_YS: [number, number, number, number] = [178, 231, 283, 337];
const SEP_YS = [205, 257, 310] as const;

function ProcessFunnel() {
  return (
    <svg
      viewBox="0 0 320 520"
      className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm"
      aria-hidden="true"
    >
      {/* ── THE IDEA label ─────────────────────────────────── */}
      <text
        x="160"
        y="20"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          fill: "var(--color-ink-400)",
        }}
      >
        THE IDEA
      </text>

      {/* ── Scatter of raw marks ─────────────────────────────── */}
      <line x1="88"  y1="52"  x2="97"  y2="42"  strokeWidth="0.75" strokeLinecap="round" style={{ stroke: "var(--color-ink-400)" }} />
      <line x1="230" y1="58"  x2="240" y2="66"  strokeWidth="0.75" strokeLinecap="round" style={{ stroke: "var(--color-ink-400)" }} />
      <line x1="148" y1="40"  x2="155" y2="31"  strokeWidth="0.5"  strokeLinecap="round" style={{ stroke: "var(--color-ink-400)" }} />
      <line x1="190" y1="108" x2="200" y2="100" strokeWidth="0.75" strokeLinecap="round" style={{ stroke: "var(--color-ink-400)" }} />
      <line x1="108" y1="112" x2="116" y2="103" strokeWidth="0.5"  strokeLinecap="round" style={{ stroke: "var(--color-ink-400)" }} />

      <circle cx="130" cy="52"  r="1.5" style={{ fill: "var(--color-ink-400)" }} />
      <circle cx="250" cy="78"  r="1"   style={{ fill: "var(--color-ink-400)" }} />
      <circle cx="76"  cy="82"  r="1.5" style={{ fill: "var(--color-ink-400)" }} />
      <circle cx="204" cy="46"  r="1"   style={{ fill: "var(--color-ink-400)" }} />

      {/* Small scribble */}
      <path
        d="M 94 80 C 103 68, 111 90, 122 78 C 133 66, 141 88, 152 76"
        fill="none"
        strokeWidth="0.75"
        strokeLinecap="round"
        style={{ stroke: "var(--color-ink-400)" }}
      />

      {/* Question mark */}
      <text
        x="170"
        y="107"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "24px",
          fontWeight: "300",
          fill: "var(--color-ink-400)",
        }}
      >
        ?
      </text>

      {/* ── Funnel ─────────────────────────────────────────── */}
      <line x1="50" y1="140" x2="270" y2="140" strokeWidth="0.5" style={{ stroke: "var(--color-ink-200)" }} />

      {/* Light terracotta wash inside funnel */}
      <polygon
        points="50,140 270,140 200,380 120,380"
        fillOpacity={0.1}
        style={{ fill: "var(--color-accent-500)" }}
      />

      {/* Converging hairline walls */}
      <line x1="50"  y1="140" x2="120" y2="380" strokeWidth="0.75" strokeLinecap="round" style={{ stroke: "var(--color-ink-950)" }} />
      <line x1="270" y1="140" x2="200" y2="380" strokeWidth="0.75" strokeLinecap="round" style={{ stroke: "var(--color-ink-950)" }} />

      {/* Stage separator hairlines */}
      {SEP_YS.map((y) => {
        const { left, right } = funnelEdges(y);
        return (
          <line
            key={y}
            x1={left} y1={y}
            x2={right} y2={y}
            strokeWidth="0.4"
            style={{ stroke: "var(--color-ink-200)" }}
          />
        );
      })}

      {/* Stage rows: index number + label, centered at x=160 */}
      {STAGES.map(({ n, label }, i) => (
        <g key={n}>
          <text
            x="155"
            y={STAGE_YS[i]}
            textAnchor="end"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "7.5px",
              fontWeight: "600",
              letterSpacing: "0.02em",
              fill: "var(--color-accent-500)",
            }}
          >
            {n}
          </text>
          <text
            x="161"
            y={STAGE_YS[i]}
            textAnchor="start"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              letterSpacing: "0.06em",
              fill: "var(--color-ink-950)",
            }}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Refined-idea accent dot near funnel exit */}
      <circle cx="160" cy="366" r="4" style={{ fill: "var(--color-accent-500)" }} />

      {/* ── Connector from funnel to screen ───────────────── */}
      <line x1="160" y1="374" x2="160" y2="402" strokeWidth="0.5" style={{ stroke: "var(--color-ink-200)" }} />

      {/* ── Screen frame ───────────────────────────────────── */}
      <rect
        x="88" y="404"
        width="144" height="90"
        rx="4"
        strokeWidth="0.75"
        style={{ fill: "var(--color-background)", stroke: "var(--color-ink-950)" }}
      />
      {/* Header row separator */}
      <line x1="88" y1="420" x2="232" y2="420" strokeWidth="0.5" style={{ stroke: "var(--color-ink-200)" }} />
      {/* Content line 1 */}
      <rect x="100" y="430" width="96" height="4.5" rx="1" style={{ fill: "var(--color-ink-200)" }} />
      {/* Content line 2 */}
      <rect x="100" y="443" width="72" height="4.5" rx="1" style={{ fill: "var(--color-ink-200)" }} />
      {/* Terracotta accent block */}
      <rect x="100" y="456" width="44" height="9" rx="1" fillOpacity={0.85} style={{ fill: "var(--color-accent-500)" }} />

      {/* ── THE DESIGN label ───────────────────────────────── */}
      <text
        x="160"
        y="510"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          fill: "var(--color-ink-400)",
        }}
      >
        THE DESIGN
      </text>
    </svg>
  );
}

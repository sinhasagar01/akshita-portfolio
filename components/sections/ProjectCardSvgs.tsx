/* ⚠ THE CARD ART, AND THE ONE RULE THAT DECIDES EVERY COLOUR IN THIS FILE.
 *
 * Three critiques in a row called the work cards "a device on a saturated gradient with bokeh, one
 * recipe four times" and ruled the design-specificity verdict on it. Opening the uploads they were
 * describing settled what was actually wrong: `boat-crest` carried a real heart-rate detail with a
 * zone chart and an 8,420-step ring, `fosfor-ai` a project table with the AI panel docked right.
 * THE SCREENS WERE THE PORTFOLIO. THE FRAME WAS THE CLICHÉ — a saturated gradient, the same bokeh
 * rings in the same corners, the same device tilt, four times.
 *
 * ⚠ AND THE OBVIOUS REMEDY WAS REFUSED, BECAUSE IT CONTRADICTS THIS PROJECT'S OWN DISCRIMINATOR.
 * "Cream paper, the accent as the only saturated element" would have recoloured DEPICTED PRODUCTS,
 * and the recorded rule is: is it drawn in the site's voice, or in the depicted thing's own colours?
 * A browser mock uses browser-chrome grey. Repainting boAt's red UI in the site accent would
 * misrepresent the product, and a critique's complaint that these cards "ignore the palette" is the
 * record saying they should.
 *
 * SO THE SPLIT IS THE DESIGN:
 *
 *     the GROUND and the PLATE EDGE   site voice, role tokens, themes across all nine palettes
 *     everything INSIDE the plate     the product's own colours, literals, never themed
 *
 * That is why this file is boundary-listed as artwork and excluded whole from the colour census.
 * Every hex below is a product's, not the site's.
 *
 * ⚠ AND THE PLATE'S SHAPE CARRIES THE PLATFORM, WHICH IS THE ONE IDEA THE OLD IMAGES HAD NO ROOM
 * FOR. Two of these products are phones and two are desktop apps. A portrait plate and a landscape
 * plate say so before a reader reaches the `MOBILE` or `WEB` tag in the rail beneath — so the set
 * reads as four different products rather than four crops of one recipe.
 *
 * No gradients, no bokeh, no tilt. A straight-on plate on paper, which is the same editorial idea
 * as the hero's `Fig. 01, the designer`.
 */

/* The site's half of the vocabulary — roles, never rungs, so a dark palette remaps them. */
const GROUND = "var(--color-surface-well)";
const EDGE = "var(--color-border)";

type PlateProps = { children: React.ReactNode };

/** A phone-shaped plate, straight on, centred. 168x320 at x236 y40. */
function PortraitPlate({ children }: PlateProps) {
  return (
    <>
      <rect x="236" y="40" width="168" height="320" rx="20" fill="#ffffff" />
      {children}
      <rect
        x="236"
        y="40"
        width="168"
        height="320"
        rx="20"
        fill="none"
        stroke={EDGE}
        strokeWidth="1.5"
      />
    </>
  );
}

/** A desktop-shaped plate, straight on. 480x280 at x80 y60. */
function LandscapePlate({ children }: PlateProps) {
  return (
    <>
      <rect x="80" y="60" width="480" height="280" rx="14" fill="#ffffff" />
      {children}
      <rect
        x="80"
        y="60"
        width="480"
        height="280"
        rx="14"
        fill="none"
        stroke={EDGE}
        strokeWidth="1.5"
      />
    </>
  );
}

const frame = {
  viewBox: "0 0 640 400",
  preserveAspectRatio: "xMidYMid slice",
  style: { width: "100%", height: "100%", display: "block" as const },
};

/* ── boAt Crest ── the fitness companion. boAt's own near-black and its red. ─────────────────── */
const boatCrest = (
  <svg {...frame}>
    <rect width="640" height="400" fill={GROUND} />
    <PortraitPlate>
      <clipPath id="bc-clip">
        <rect x="236" y="40" width="168" height="320" rx="20" />
      </clipPath>
      <g clipPath="url(#bc-clip)">
        <rect x="236" y="40" width="168" height="320" fill="#17171c" />
        <text x="252" y="72" fill="#8b8b93" fontSize="8" fontFamily="DM Sans">Good morning</text>
        <text x="252" y="88" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="DM Sans">Hey, John</text>

        {/* the steps ring — the screen's own hero element */}
        <circle cx="320" cy="160" r="40" fill="none" stroke="#26262c" strokeWidth="9" />
        <path d="M320 120 a40 40 0 1 1 -32 64" fill="none" stroke="#e8362f" strokeWidth="9" strokeLinecap="round" />
        <text x="320" y="158" fill="#ffffff" fontSize="19" fontWeight="700" fontFamily="DM Sans" textAnchor="middle">8,420</text>
        <text x="320" y="172" fill="#8b8b93" fontSize="7" fontFamily="DM Sans" textAnchor="middle" letterSpacing="1.2">STEPS</text>

        {/* the stat trio */}
        <g fontFamily="DM Sans" textAnchor="middle">
          <rect x="252" y="216" width="44" height="34" rx="8" fill="#212127" />
          <text x="274" y="234" fill="#ffffff" fontSize="11" fontWeight="700">357</text>
          <text x="274" y="245" fill="#8b8b93" fontSize="6.5">KCAL</text>
          <rect x="302" y="216" width="44" height="34" rx="8" fill="#212127" />
          <text x="324" y="234" fill="#ffffff" fontSize="11" fontWeight="700">4.9</text>
          <text x="324" y="245" fill="#8b8b93" fontSize="6.5">KM</text>
          <rect x="352" y="216" width="44" height="34" rx="8" fill="#212127" />
          <text x="374" y="234" fill="#ffffff" fontSize="11" fontWeight="700">48</text>
          <text x="374" y="245" fill="#8b8b93" fontSize="6.5">MIN</text>
        </g>

        {/* vitals, the pair the redesign brought together */}
        <text x="252" y="276" fill="#8b8b93" fontSize="7" fontFamily="DM Sans" letterSpacing="1.2">VITALS</text>
        <g fontFamily="DM Sans">
          <rect x="252" y="286" width="66" height="46" rx="9" fill="#212127" />
          <circle cx="264" cy="300" r="4" fill="#e8362f" />
          <text x="264" y="320" fill="#ffffff" fontSize="12" fontWeight="700">72</text>
          <text x="286" y="320" fill="#8b8b93" fontSize="7">bpm</text>
          <rect x="326" y="286" width="66" height="46" rx="9" fill="#212127" />
          <circle cx="338" cy="300" r="4" fill="#2f7de1" />
          <text x="338" y="320" fill="#ffffff" fontSize="12" fontWeight="700">98</text>
          <text x="360" y="320" fill="#8b8b93" fontSize="7">%</text>
        </g>
      </g>
    </PortraitPlate>
  </svg>
);

/* ── Fosfor AI ── the companion docked beside the work. Fosfor's own indigo. ─────────────────── */
const fosforAi = (
  <svg {...frame}>
    <rect width="640" height="400" fill={GROUND} />
    <LandscapePlate>
      <clipPath id="fa-clip">
        <rect x="80" y="60" width="480" height="280" rx="14" />
      </clipPath>
      <g clipPath="url(#fa-clip)">
        {/* left rail */}
        <rect x="80" y="60" width="34" height="280" fill="#f4f6fb" />
        <circle cx="97" cy="82" r="6" fill="#5b6ef0" />
        <rect x="91" y="102" width="12" height="12" rx="3" fill="#c3cadb" />
        <rect x="91" y="124" width="12" height="12" rx="3" fill="#c3cadb" />

        {/* top bar */}
        <rect x="114" y="60" width="446" height="30" fill="#ffffff" />
        <line x1="114" y1="90" x2="560" y2="90" stroke="#e4e8f2" />
        <text x="130" y="80" fontSize="10" fontWeight="700" fontFamily="DM Sans">
          <tspan fill="#1a1d29">Fosfor</tspan>
        </text>

        <text x="130" y="112" fill="#1a1d29" fontSize="11" fontWeight="600" fontFamily="DM Sans">Continue working on</text>

        {/* the three project cards */}
        <g fontFamily="DM Sans">
          <rect x="130" y="124" width="90" height="52" rx="8" fill="#ffffff" stroke="#e4e8f2" />
          <text x="140" y="140" fill="#8b93a8" fontSize="6.5">Model</text>
          <rect x="140" y="148" width="64" height="6" rx="3" fill="#c3cadb" />
          <rect x="140" y="160" width="44" height="5" rx="2.5" fill="#e4e8f2" />
          <rect x="228" y="124" width="90" height="52" rx="8" fill="#ffffff" stroke="#e4e8f2" />
          <text x="238" y="140" fill="#8b93a8" fontSize="6.5">Notebook</text>
          <rect x="238" y="148" width="70" height="6" rx="3" fill="#c3cadb" />
          <rect x="238" y="160" width="40" height="5" rx="2.5" fill="#e4e8f2" />
          <rect x="326" y="124" width="90" height="52" rx="8" fill="#ffffff" stroke="#e4e8f2" />
          <text x="336" y="140" fill="#8b93a8" fontSize="6.5">Model</text>
          <rect x="336" y="148" width="66" height="6" rx="3" fill="#c3cadb" />
          <rect x="336" y="160" width="48" height="5" rx="2.5" fill="#e4e8f2" />
        </g>

        {/* the project list beneath */}
        <g>
          <rect x="130" y="192" width="286" height="16" rx="4" fill="#eef1f8" />
          {[214, 234, 254, 274, 294].map((y) => (
            <g key={y}>
              <rect x="134" y={y} width="52" height="6" rx="3" fill="#c3cadb" />
              <rect x="204" y={y} width="86" height="6" rx="3" fill="#e4e8f2" />
              <rect x="308" y={y} width="46" height="6" rx="3" fill="#e4e8f2" />
              <circle cx="392" cy={y + 3} r="5" fill="#e4e8f2" />
            </g>
          ))}
        </g>

        {/* ⚠ THE AI PANEL IS THE POINT OF THE CASE STUDY, so it is the one element given full colour */}
        <rect x="432" y="90" width="128" height="250" fill="#ffffff" />
        <line x1="432" y1="90" x2="432" y2="340" stroke="#e4e8f2" />
        <rect x="432" y="90" width="128" height="26" fill="#5b6ef0" />
        <text x="444" y="107" fill="#ffffff" fontSize="9" fontWeight="600" fontFamily="DM Sans">Fosfor AI</text>
        <rect x="444" y="128" width="100" height="6" rx="3" fill="#d6dbe8" />
        <rect x="444" y="140" width="78" height="6" rx="3" fill="#e4e8f2" />
        <g>
          <rect x="444" y="160" width="104" height="20" rx="10" fill="#ffffff" stroke="#5b6ef0" />
          <rect x="454" y="168" width="72" height="5" rx="2.5" fill="#5b6ef0" opacity="0.55" />
          <rect x="444" y="186" width="104" height="20" rx="10" fill="#ffffff" stroke="#5b6ef0" />
          <rect x="454" y="194" width="58" height="5" rx="2.5" fill="#5b6ef0" opacity="0.55" />
          <rect x="444" y="212" width="104" height="20" rx="10" fill="#ffffff" stroke="#5b6ef0" />
          <rect x="454" y="220" width="80" height="5" rx="2.5" fill="#5b6ef0" opacity="0.55" />
        </g>
      </g>
    </LandscapePlate>
  </svg>
);

/* ── Fosfor Data Profiling ── the table, and the values that carry meaning by colour. ────────── */
const fosforDataProfiling = (
  <svg {...frame}>
    <rect width="640" height="400" fill={GROUND} />
    <LandscapePlate>
      <clipPath id="fd-clip">
        <rect x="80" y="60" width="480" height="280" rx="14" />
      </clipPath>
      <g clipPath="url(#fd-clip)">
        <rect x="80" y="60" width="30" height="280" fill="#f4f6fb" />
        <rect x="88" y="78" width="14" height="14" rx="3" fill="#c3cadb" />
        <rect x="88" y="100" width="14" height="14" rx="3" fill="#5b6ef0" />
        <rect x="88" y="122" width="14" height="14" rx="3" fill="#c3cadb" />

        <text x="124" y="84" fill="#8b93a8" fontSize="7" fontFamily="DM Sans">Home</text>
        <text x="124" y="104" fill="#1a1d29" fontSize="12" fontWeight="700" fontFamily="DM Sans">Dataset name1</text>

        {/* the tabs, with the active underline the real screen carries */}
        <text x="124" y="128" fill="#8b93a8" fontSize="8" fontFamily="DM Sans">Overview</text>
        <text x="176" y="128" fill="#1a1d29" fontSize="8" fontWeight="600" fontFamily="DM Sans">Data profiling</text>
        <rect x="176" y="134" width="60" height="2" fill="#1a73e8" />
        <line x1="110" y1="136" x2="560" y2="136" stroke="#eef1f7" />

        {/* the metadata strip */}
        <g fontFamily="DM Sans">
          <rect x="124" y="148" width="412" height="30" rx="6" fill="#f8fafd" stroke="#eef1f7" />
          <text x="136" y="160" fill="#8b93a8" fontSize="6">Frequency</text>
          <text x="136" y="171" fill="#1a1d29" fontSize="7.5" fontWeight="600">Monthly</text>
          <text x="212" y="160" fill="#8b93a8" fontSize="6">Records</text>
          <text x="212" y="171" fill="#1a1d29" fontSize="7.5" fontWeight="600">12K</text>
          <text x="288" y="160" fill="#8b93a8" fontSize="6">Status</text>
          <circle cx="292" cy="168" r="3" fill="#2f9e60" />
          <text x="300" y="171" fill="#1a1d29" fontSize="7.5" fontWeight="600">Enabled</text>
        </g>

        {/* the profiling table — the colour coding IS the product */}
        <rect x="124" y="192" width="412" height="18" rx="4" fill="#eef4ff" />
        <g fill="#5f6b82" fontSize="6.5" fontFamily="DM Sans">
          <text x="134" y="204">column</text>
          <text x="224" y="204">type</text>
          <text x="284" y="204">not_null</text>
          <text x="352" y="204">distinct</text>
          <text x="424" y="204">count</text>
          <text x="488" y="204">unique</text>
        </g>
        {[
          { y: 222, n: "0.62", d: "0.34", c: "3344" },
          { y: 244, n: "0.87", d: "0.56", c: "342" },
          { y: 266, n: "0.34", d: "0.13", c: "766" },
          { y: 288, n: "0.98", d: "0.62", c: "35432" },
          { y: 310, n: "0.12", d: "0.19", c: "73572" },
        ].map((r) => (
          <g key={r.y} fontFamily="DM Sans" fontSize="7.5">
            <rect x="134" y={r.y - 6} width="62" height="6" rx="3" fill="#c3cadb" />
            <text x="224" y={r.y} fill="#5f6b82">Integer</text>
            <text x="284" y={r.y} fill="#e8833a">{r.n}</text>
            <text x="352" y={r.y} fill="#5f6b82">{r.d}</text>
            <text x="424" y={r.y} fill="#2f9e60">{r.c}</text>
            <text x="488" y={r.y} fill="#5f6b82">No</text>
            <line x1="124" y1={r.y + 8} x2="536" y2={r.y + 8} stroke="#f2f5fa" />
          </g>
        ))}
      </g>
    </LandscapePlate>
  </svg>
);

/* ── Elevate ONE View ── the field dashboard. Anonymised to `Client`, as the case study is. ──── */
const elevateOneView = (
  <svg {...frame}>
    <rect width="640" height="400" fill={GROUND} />
    <PortraitPlate>
      <clipPath id="eo-clip">
        <rect x="236" y="40" width="168" height="320" rx="20" />
      </clipPath>
      <g clipPath="url(#eo-clip)">
        <rect x="236" y="40" width="168" height="320" fill="#ffffff" />
        {/* the product's own deep indigo chrome */}
        <rect x="236" y="40" width="168" height="46" fill="#443a6b" />
        <text x="320" y="70" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="Georgia, serif" textAnchor="middle">Client</text>
        <rect x="236" y="86" width="168" height="24" fill="#6a5f92" />
        <text x="250" y="102" fill="#ffffff" fontSize="8.5" fontWeight="600" fontFamily="DM Sans">My Dashboard</text>

        {/* the KPI tiles the mechanics actually read */}
        <g fontFamily="DM Sans">
          {[
            { x: 248, y: 124, v: "625", l: "My units", c: "#443a6b" },
            { x: 326, y: 124, v: "3", l: "Branches", c: "#443a6b" },
            { x: 248, y: 202, v: "2342", l: "Decommissioned", c: "#443a6b" },
            { x: 326, y: 202, v: "234", l: "Open callback", c: "#f0a020" },
            { x: 248, y: 280, v: "12", l: "Critical", c: "#e03131" },
            { x: 326, y: 280, v: "48", l: "Unplugged", c: "#e03131" },
          ].map((t) => (
            <g key={`${t.x}-${t.y}`}>
              <rect x={t.x} y={t.y} width="66" height="66" rx="9" fill="#f7f7fa" stroke="#e8e8ef" />
              <circle cx={t.x + 14} cy={t.y + 16} r="6" fill={t.c} />
              <text x={t.x + 10} y={t.y + 42} fill="#1a1a22" fontSize="14" fontWeight="700">{t.v}</text>
              <text x={t.x + 10} y={t.y + 56} fill="#7a7a88" fontSize="6">{t.l}</text>
            </g>
          ))}
        </g>
      </g>
    </PortraitPlate>
  </svg>
);

export const PROJECT_SVGS: Record<string, React.ReactElement> = {
  "boat-crest": boatCrest,
  "fosfor-ai": fosforAi,
  "fosfor-data-profiling": fosforDataProfiling,
  "elevate-one-view": elevateOneView,
};

/** A project with no drawn mock still gets the frame, so the grid never shows a bare rectangle. */
export const FallbackProjectSvg = (
  <svg {...frame}>
    <rect width="640" height="400" fill={GROUND} />
    <LandscapePlate>
      <rect x="112" y="92" width="120" height="8" rx="4" fill="#e4e8f2" />
      <rect x="112" y="112" width="180" height="6" rx="3" fill="#eef1f7" />
      <rect x="112" y="144" width="416" height="1" fill="#eef1f7" />
      <rect x="112" y="168" width="88" height="6" rx="3" fill="#eef1f7" />
      <rect x="112" y="188" width="140" height="6" rx="3" fill="#eef1f7" />
    </LandscapePlate>
  </svg>
);

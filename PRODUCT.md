# Product

<!-- impeccable:product-schema 1 -->

<!-- DERIVED, NOT INTERVIEWED. Written from docs/portfolio-prd.md, CLAUDE.md, TASKS.md and the
     shipped code, at the owner's instruction, rather than from an init interview. Facts carried
     from those documents are stated plainly. Anything inferred is marked INFERRED and is the
     first thing to correct. -->

## Platform

web

## Users

The primary audience is recruiters and hiring managers evaluating a product designer. They arrive
from a link or a search, they are short on time, and they are deciding whether this person can
think rather than whether this person can decorate.

The single most important action is reading one full case study and then either making contact or
downloading the resume. Secondary actions are browsing the project list and scanning experience and
skills.

A second, smaller audience is other designers and engineers who read the writing. The blog collection
ships with three published posts and a live nav link.

INFERRED. The owner is the third user, in the studio editor rather than on the public site, updating
content without touching code.

## Product Purpose

A custom coded portfolio for Akshita, a product designer. It replaced a Framer template that carried
template residue, switched visual language from page to page, and presented case studies as walls of
sections rather than as stories.

It exists to do two jobs at once. It sells the designer, and it is itself the code sample, because
the job search is active and the site is the artefact.

Success is a recruiter reading one case study end to end and then contacting or downloading.

## Positioning

Process and decision making told as a narrative, in one consistent light editorial language across
every page. The differentiator is not the projects, which a neighbouring portfolio could match. It is
that each case study is a story with a fixed spine rather than a dump of final screens, and that the
whole site holds one voice instead of one world per project.

The second position, harder to copy, is that the site is hand built and owns its own editor, so the
craft claim is demonstrated rather than asserted.

## Operating Context

Read on a phone between meetings as often as on a desktop. The site goes mobile all at once at
1024px, Tailwind `lg`, rather than staging a two column to stacked transition at `md`.

Content is edited by the owner at `/studio`, an owner gated editor that commits to a draft branch and
publishes to `main` by merge. Keystatic supplies the content schema only. Its editing UI was retired
and must not be re-added.

Hosting is Vercel Hobby. Production is `www.akshitas.com`, with the apex redirecting 308. Deploys are
rate limited in a way that punishes a fast merge cadence, so shipped work is batched.

## Capabilities and Constraints

Four case studies at launch, and this set is locked.

- boAt Crest redesign, the hero. App rating rose from 2.3 to 4. The most complete story.
- Fosfor AI, the on trend piece. An AI companion across three personas.
- Fosfor Data Profiling, the enterprise piece.
- Elevate ONE View, the current role, under a confidentiality constraint, so the narrative carries
  more weight than the screens.

Every case study follows one fixed eleven section arc. Hero thesis, summary block, three impact
numbers, context, problem, goals and North Star, process and key insights, solution reveal, guided
design tour, reflections, warm closing line.

Beyond the four studies the site carries a home page, an experience timeline of five roles, a skills
section, a gallery collection, and a blog collection with its own schema, editor and public pages.

Stack. Next.js App Router with TypeScript, Tailwind v4, Motion for component motion, Lenis for smooth
scroll, GSAP for heavier scroll choreography. Images live in the repo, upload through `/studio`, and
are served by Next.js image optimization. All of it free and open source.

Terminology worth preserving. A **case study** is one of the four. A **section** is one unit of the
eleven part spine. A **block** is a schema kind inside a section. The **studio** is the editor and
the **canvas** is the studio's live preview, which renders through the same components as the public
article.

Undecided. Whether the Fosfor outcome figures now in place are final is the owner's judgement rather
than a filled or empty field question.

## Brand Commitments

The name is Akshita. The wordmark is a Kaushan Script signature lockup, script "Akshita" beside
tracked caps "SINGH", and the footer sets the full name above "PRODUCT DESIGNER" as a signature sign
off. A wordmark in its own face is deliberate and is not an inconsistency with headings set in a
serif.

The favicon is invariant by construction. An SVG behind an `img src` cannot read the page custom
properties, so the mark carries baked hex and does not follow the palette. The wordmark does follow
the palette. That split is a recorded decision rather than drift.

Voice. First person where the work was hers. The team is named only where collaboration is the actual
point. No template residue, no borrowed premium template label, no hypothetical metrics standing in
for real outcomes.

Writing rules, binding on site copy and on documentation in this repository. No colons, no semicolons,
no em dashes, no forward slashes joining two words.

## Evidence on Hand

Real. The boAt Crest outcome, an app rating rising from 2.3 to 4, backed by interviews, a 100 user
survey, personas, an empathy map, competitive analysis, a journey map and a design system. Real screen
exports with real alt text, uploaded by the owner through `/studio`. A real portrait at
`public/images/photo.webp`. Real per case study share images. Core Web Vitals passing on field CrUX
data for `www.akshitas.com`, not only a lab score. A live contact form confirmed end to end through
Web3Forms.

Content sources live under `docs/`, one file per study, plus `docs/home-content.md` and
`docs/portfolio-prd.md`.

Absent, and not to be fabricated. Testimonials, named clients beyond the employers already listed,
pricing, awards, and press. Elevate ONE View is confidentiality constrained, so its visible screens
are limited by agreement rather than by effort.

## Product Principles

1. **One language across every page.** The predecessor swung from light landing to dark boAt to
   purple Elevate. Holding one editorial voice is the whole premise of the rebuild, so a per page
   world is a regression rather than a flourish.
2. **One idea per section.** The spine exists to walk a reader through rather than drop everything at
   once. A section that carries two ideas should be two sections.
3. **The dashboard owns words and images. The code owns the design system, the motion and the
   layout.** An editable field is not an invitation to make layout editable.
4. **Craft over library.** The premium feel comes from spring physics, scroll driven reveals, a tight
   type scale and deliberate whitespace, not from adding a package.
5. **Honest numbers.** Real outcomes where they exist, an honest measurement framing where they do
   not, and never a hypothetical metric dressed as a result.

## Accessibility & Inclusion

Reduced motion is respected throughout, by a global CSS killswitch plus `useReducedMotion` on every
JavaScript source, including Lenis and GSAP.

Keyboard reachability is a shipped commitment. Visible focus, a skip to content link, a textbook
focus trap on the mobile menu, and no hidden focusable leak.

Contrast is enforced rather than eyeballed. Ratios are rasterised through a canvas pixel with a
sanity pair asserted first, and every ratio is stated with the ground it was taken on. The small text
floor is 4.5 and the non text floor is 3.0.

Real alt text on every image is a launch condition already met.

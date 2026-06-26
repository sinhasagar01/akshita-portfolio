# Product Designer Portfolio Rebuild PRD

Version 2. Updated after reviewing the real page exports and the storytelling inspiration.

## 1. Summary

A ground up rebuild of Akshita's product designer portfolio as a custom coded site. The current site runs on the Athos free Framer template, carries template residue, switches visual language from page to page, and presents its case studies as walls of sections rather than as stories. The rebuild delivers a premium, recruiter facing portfolio that foregrounds design process and decisions, told as a clear narrative, and that doubles as a frontend code sample for an active job search.

The site ships with four strong case studies rather than all seven, in one consistent light editorial design language, and includes a lightweight editing dashboard so content and images can be updated without touching code. Every piece of the stack is free and open source, deployed on a custom domain that is already owned.

## 2. Goals

- Showcase design process and decision making as a story, not just final screens
- Ship four genuinely strong case studies, boAt Crest as the hero
- Hold one consistent design language across every page
- Reach a premium, editorial feel through motion, scroll choreography, type, and whitespace
- Let content and images be edited through a simple, login gated dashboard
- Stand as a credible code sample, clean and ownable
- Load fast, rank cleanly, and read well on mobile

## 3. Non goals

- Not carrying all seven existing projects at launch
- Not a blog, not e commerce, not a general purpose content system
- No heavy backend, no custom authentication beyond the dashboard login
- No paid products or services anywhere in the stack

## 4. Audience and primary action

The primary audience is recruiters and hiring managers. The single most important action is reading one full case study and then either making contact or downloading the resume. Secondary actions are browsing the project list and scanning experience and skills.

## 5. Content scope

### Case studies at launch, four locked

- boAt Crest redesign, the hero. The most complete story, with interviews, a 100 user survey, personas, an empathy map, competitive analysis, a journey map, a design system, named features like Watchface Studio and guided onboarding, and a real outcome, the app rating rising from 2.3 to 4.
- Fosfor AI, the on trend piece. An AI companion across three personas, with problem framing, objectives, a twelve week timeline, a design process, and a detailed information architecture. Still needs a real outcome or a properly framed close.
- Fosfor Data Profiling, the enterprise piece. Clear problem, challenge, process, a competitive landscape, and metrics. Needs the borrowed template copy stripped and the metrics reframed as either real results or an honest measurement framework.
- Elevate ONE View, the current role. A strong enterprise story, with a four stage design process, stakeholder mapping, global reach across APAC, EMEA, NAA and China, a feature breakdown, product gaps, solutions, and a learnings note. Under a confidentiality constraint, so the visible screens are limited and the narrative carries more of the weight.

### Supporting content

- An experience timeline, five roles from Perpule through LTIMindtree
- A skills section
- A resume link and contact
- A hero photo, already part of the current landing, kept

### Future, not at launch

- The Fosfor design system, a strong future case study once written as a story rather than left as a raw Figma link
- One dashboard UI, project management or e commerce, only if a short visual sample is wanted later

### Content cleanup required

- Remove all template residue, including wrong page titles, the template author's booking link, and the recurring premium template label
- Unify the design language, since the current pages swing from light landing to dark boAt to purple Elevate, each its own world
- Compress the boAt page, which currently repeats whole blocks and shows everything at once, into the guided story spine
- Fix the voice so it stays first person where the work was hers, and names the team only where collaboration is the actual point
- Fix copy bugs, including the boAt persona named Sagar whose description then calls him Rahul, and the duplicated e commerce descriptions
- Replace hypothetical metrics with real outcomes wherever they exist

## 6. Case study template, the storytelling spine

Every case study follows one narrative arc, taken from the inspiration pages. The point is one idea per section, walking the reader through rather than dropping everything at once.

1. Hero. One italic sentence stating the thesis, with a thin meta line under it, role, type, platform, timeline
2. Summary block. Product, Problem, Details, Solution, Result, so a busy recruiter gets the whole story in ten seconds
3. Impact. Three big numbers and nothing more
4. Context. Who the company is and the situation
5. Problem. One sharp statement, often set over a single bold image
6. Goals and the North Star. What winning looks like
7. Process and key insights. The method, plus two or three numbered insights that made the thinking visible
8. Solution reveal. One confident line and a brand visual
9. Guided design tour. Each section is one screen or one interaction, a short title and two or three sentences, one idea at a time
10. Reflections, then what I would do next
11. A warm closing line

## 7. Design direction

Light editorial, set as the working default and drawn from two agreeing signals, the current landing and Fosfor pages that are already light, soft, and warm, and the inspiration pages that are light cream editorial with italic serif headings. One language runs across every page, the opposite of today's page by page swings.

The premium feel comes from craft, not from any single library. The levers are motion with real spring physics, scroll driven reveals and parallax, a tight type scale anchored by a strong display serif, deliberate whitespace, and restraint. A reduced motion preference is respected throughout. The exact palette and type pairing get settled with a small set of design tokens before any page is built.

## 8. Technical stack

All free and open source.

- Framework, Next.js with the App Router and TypeScript
- UI, React with Tailwind for styling
- Animation, Motion for component motion, Lenis for smooth scrolling, and GSAP for heavier scroll choreography where needed
- Content and dashboard, Keystatic, open source and git based
- Images, stored in the repo through Keystatic, then optimized and served by Next.js image optimization
- Hosting, Vercel Hobby tier
- Domain, the custom domain already owned
- Type, free variable fonts

## 9. Content model

Keystatic holds the content as a small set of collections and settings.

- Projects, each with a title, summary, facts, hero image, ordering, and a flexible body
- Case study body, modelled as an ordered list of section blocks, so sections can be added, reordered, and filled from the dashboard while each block renders through a polished coded component. Block types include hero, summary grid, impact numbers, intro or context, problem, goals, process steps, key insights, solution reveal, guided design step, image or gallery, comparison, quote, reflection, and closing line.
- Experience, a list of roles with company, title, and dates
- Skills, a simple list
- Site settings, holding the hero copy, the positioning line, the photo, the resume link, social links, and contact details

The three blocks the storytelling spine adds on top of the earlier model are the summary grid, the key insights block, and the guided design step, meaning a titled screen with a short caption. This hybrid keeps editable content and bespoke, art directed layouts at the same time. The dashboard owns words and images. The code owns the design system, the motion, and the layout.

## 10. Dashboard requirements

A deliberately limited editing surface, login gated, reachable inside the same app.

- Edit hero and positioning copy
- Add, reorder, and edit projects
- Build and edit case study sections from the block types
- Upload and swap images
- Edit experience and skills
- Update the resume link, social links, and contact details

Nothing beyond what the portfolio needs. No comments, no extra users, no roles, no approval workflow.

## 11. Quality targets

- Strong Core Web Vitals on mobile and desktop
- Correct per page titles and descriptions, fixing the current template titles
- A custom share image per case study
- Semantic markup, real alt text on every image, and keyboard reachable navigation
- Respects a reduced motion preference

## 12. Build sequence

- Phase 0, setup. Repo, Next.js, Tailwind, Vercel, the domain, fonts, and design tokens
- Phase 1, foundation. The design system, layout primitives, and the motion and scroll baseline
- Phase 2, the home page
- Phase 3, the case study template wired to Keystatic, with all the spine block types built
- Phase 4, content. Pour and clean the four case studies into the spine, with real copy and real outcomes
- Phase 5, polish. Performance, search readiness, accessibility, final motion tuning, and launch

## 13. Open items needed from you

- The actual domain name, for deployment configuration
- Real outcome numbers for Fosfor AI and Fosfor Data Profiling, if any exist
- A confirmation or a tweak on the light editorial direction before tokens are set
- The cleaned case study copy, which we can write together section by section, starting with boAt

### Settled since version 1

- Case study count, four, boAt as hero, plus Fosfor AI, Fosfor Data Profiling, and Elevate
- The fourth study, Elevate, now that its real content is in hand
- Design direction, light editorial as the working default
- Hero photo, kept

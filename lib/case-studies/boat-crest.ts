import type { CaseStudy } from "./types";

// In-app screens — static imports give next/image true aspect + a blur placeholder.
import home from "@/public/work/boat-crest/01-home.png";
import homeLight from "@/public/work/boat-crest/01-home-light.png";
import heartRate from "@/public/work/boat-crest/04-heart-rate.png";
import beforeHome from "@/public/work/boat-crest/before-home.png";
import onboardingPair from "@/public/work/boat-crest/17-onboarding-pair.png";
import watchfaceStudio from "@/public/work/boat-crest/12-watchface-studio.png";
import fitCrew from "@/public/work/boat-crest/13-fit-crew.png";
import beforeActivity from "@/public/work/boat-crest/before-activity.png";
import activityDetail from "@/public/work/boat-crest/02-activity-detail.png";
import beforeVitals from "@/public/work/boat-crest/before-vitals.png";
import vitalsHub from "@/public/work/boat-crest/03-vitals-hub.png";

/* Copy is transcribed verbatim from the source panels in docs/case-study-page/html.
   It uses em dashes, arrows and middots; reconciling that with the project writing
   rules is a deliberate later editorial pass (see the plan's flag 4). */

export const boatCrest: CaseStudy = {
  slug: "boat-crest",
  title: "boAt Crest",
  thesis: "Making the app worthy of the watch.",
  description:
    "A ground-up redesign of boAt's smartwatch companion app, from cluttered and one-size-fits-all into a calm, personal system, lifting the store rating from 2.3 to 4.2.",
  sections: [
    // 1 — Hero cover
    {
      id: "hero",
      variant: "hero",
      // Note: the hero's "crest" watermark is rendered + animated inside HeroCover
      // (so its fade-in is part of the mount entrance), not via section.glow.
      blocks: [
        {
          kind: "heroCover",
          title: "boAt Crest",
          thesis: "Making the app worthy of the watch.",
          position:
            "A ground-up redesign of boAt's smartwatch companion app — from cluttered and one-size-fits-all into a calm, personal system people actually want to open.",
          ratingChip: { stat: "★ 4.2", rest: "App Store rating · up from 2.3" },
          meta: [
            { label: "My role", value: "Sole product designer" },
            { label: "Scope", value: "Research · UX · UI · System" },
            { label: "Platform", value: "iOS · Android" },
            { label: "Timeline", value: "2024" },
          ],
          glow: { text: "calm", size: "clamp(6rem, 12vw, 11rem)" },
          devices: [
            {
              src: heartRate,
              alt: "Heart rate detail screen with a live animated reading",
              width: 248,
              rotate: -6,
              translate: [-86, 16],
              z: 1,
            },
            {
              src: home,
              alt: "boAt Crest redesigned home screen in the dark Midnight Ember theme",
              width: 288,
              z: 3,
            },
          ],
        },
      ],
    },

    // 2 — Setup
    {
      id: "setup",
      index: "01",
      eyebrow: "The setup",
      title: "Great hardware,\na neglected app.",
      lead: [
        "boAt is one of India's biggest consumer-electronics brands, built on affordable, stylish audio and a fast-growing line of smartwatches. ",
        { b: "boAt Crest" },
        " is the companion app that pairs with those watches to track fitness, health and daily activity. By the time this redesign began, the app had fallen behind the hardware — the watches sold well, but the companion felt cluttered and dated, and the store rating showed it.",
      ],
      glow: { text: "worthy", bottom: "-30px", left: "30px", size: "clamp(6rem, 13vw, 11rem)" },
      blocks: [
        { kind: "pullQuote", text: "My job was to make the app worthy of the watch on the wrist." },
        {
          kind: "glanceGrid",
          items: [
            { label: "Product", value: "Companion app for boAt smartwatches" },
            { label: "The gap", value: "Cluttered, hard to navigate, easy to abandon" },
            { label: "Approach", value: "Declutter, personalise, systematise" },
            { label: "Outcome", value: "2.3 → 4.2 store rating" },
          ],
        },
      ],
    },

    // 3 — Problem (split: issue list beside the annotated old screen)
    {
      id: "problem",
      index: "02",
      eyebrow: "The problem",
      title: "Everything at once — so nothing stood out.",
      lead: "One screen tried to do everything, with no hierarchy to guide the eye. The things that mattered — your day, your activity — got lost in the noise.",
      layout: "split",
      glow: { text: "noise", bottom: "-20px", left: "36px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "issueList",
          items: [
            { title: "Competing colours", note: "A different hue everywhere — nothing earns attention" },
            { title: "Upsell nags", note: '"Earn boAt coins" and profile prompts above your data' },
            { title: "Promo blocks", note: '"Set up your watch" merch pushes content down' },
            { title: "Five-tab nav", note: "Five destinations, none of them clear" },
          ],
        },
        {
          kind: "annotatedImage",
          image: {
            src: beforeHome,
            alt: "The old boAt Crest home screen, cluttered with competing colours and promos",
            width: 300,
            rotate: -4,
          },
          scrawl: { text: "where do\nI even look?", top: "0", right: "0" },
        },
      ],
    },

    // 4 — Goals
    {
      id: "goals",
      index: "03",
      eyebrow: "Goals",
      northStar:
        "An app boAt users actually want to open — calm, personal, and worth coming back to.",
      glow: { text: "calm", top: "24px", right: "34px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "principleCards",
          cards: [
            {
              index: "01",
              title: "Declutter",
              body: "Strip the noise down to one glanceable home, and let weight and colour — not decoration — carry the hierarchy.",
            },
            {
              index: "02",
              title: "Personalise",
              body: "Guided onboarding and workouts instead of one-size-fits-all, with social challenges that keep people coming back.",
            },
            {
              index: "03",
              title: "Systematise",
              body: "A single token-driven design system, consistent across every screen and across both dark and light.",
            },
          ],
        },
      ],
    },

    // 5 — Approach
    {
      id: "approach",
      index: "04",
      eyebrow: "Approach",
      title: "Grounded in research, focused by insight.",
      lead: "Before a single screen, I ran interviews, a 100-person survey and a competitive teardown of leading fitness apps — then let the findings, not assumptions, set the direction.",
      glow: { text: "why", bottom: "-10px", right: "40px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "stepper",
          steps: [
            { label: "Discover", text: "Interviews, a 100-person survey, and a competitive teardown of leading fitness apps." },
            { label: "Define", text: "A primary persona, empathy map, and journey — anchoring every decision in a real person." },
            { label: "Develop", text: "Information architecture, the design system, and high-fidelity screens for every flow." },
            { label: "Deliver", text: "Split-tested the new flows against the old, then handoff and support through build." },
          ],
        },
        {
          kind: "statCards",
          heading: "What the research told me",
          stats: [
            {
              value: "75",
              suffix: "%",
              body: "already used a fitness app regularly — the demand was real; the old experience just wasn't meeting it.",
              tag: "The demand",
            },
            {
              value: "90",
              suffix: "%",
              body: "were dissatisfied with the old interface — proof the problem was the experience, not the hardware.",
              tag: "The mandate",
              highlighted: true,
            },
            {
              value: "85",
              suffix: "%",
              body: "wanted guided workouts over generic exercises — so guidance became the backbone of the flows.",
              tag: "The direction",
            },
          ],
        },
      ],
    },

    // 6 — The system
    {
      id: "system",
      index: "05",
      eyebrow: "The system",
      title: "One system, two themes.",
      lead: [
        "A single token set drives both ",
        { b: "Midnight Ember" },
        " (dark, the shipping default) and ",
        { b: "Daybreak" },
        " (light). Semantic colours — heart, sleep, oxygen — stay constant, so your data reads the same in either.",
      ],
      glow: { text: "system", top: "24px", left: "38px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "deviceShelf",
          devices: [
            {
              src: home,
              alt: "boAt Crest home screen in the dark Midnight Ember theme",
              width: 248,
              label: "Midnight Ember · dark",
            },
            {
              src: homeLight,
              alt: "boAt Crest home screen in the light Daybreak theme",
              width: 248,
              label: "Daybreak · light",
            },
          ],
        },
        {
          kind: "swatchTokens",
          groups: [
            {
              tokens: [
                { type: "color", name: "boAt Red", value: "#EC3A23", hex: "#EC3A23" },
                { type: "color", name: "Indigo", value: "#4F46E5", hex: "#4F46E5" },
              ],
            },
            {
              tokens: [
                { type: "color", name: "Heart", value: "#FF4D6D" },
                { type: "color", name: "SpO₂", value: "#3BC9FF" },
                { type: "color", name: "Sleep", value: "#A78BFA" },
              ],
            },
            {
              tokens: [
                { type: "font", name: "Hanken Grotesk", note: "display · UI" },
                { type: "font", name: "JetBrains Mono", note: "numerals" },
              ],
            },
          ],
        },
      ],
    },

    // 7 — The work
    {
      id: "work",
      index: "06",
      eyebrow: "The work",
      title: "Where the redesign lives.",
      lead: "Five places the new system does real work for the person wearing the watch — each a small fix that compounds into a calmer whole.",
      glow: { text: "made", top: "18px", right: "36px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "featureRows",
          features: [
            {
              index: "01",
              category: "Onboarding",
              title: "A setup that holds your hand.",
              body: "Pairing used to drop people into a cluttered home. Now a short, guided flow connects the watch and sets the basics — so the first thing you feel is momentum, not confusion.",
              image: { src: onboardingPair, alt: "Guided onboarding screen for pairing the watch", width: 214 },
            },
            {
              index: "02",
              category: "Navigation",
              title: "Four tabs. One glance.",
              body: "The home screen answers the only question that matters in the morning — how am I doing? — with steps, vitals, sleep and a recommended session, in that order. Everything else moved one tap away.",
              image: { src: home, alt: "Redesigned home screen with a four-tab navigation", width: 214 },
            },
            {
              index: "03",
              category: "Insights",
              title: "Vitals you can watch move.",
              body: "Heart rate, SpO₂ and sleep each get a focused detail screen with live, animated readings and honest ranges — data that reassures instead of alarms.",
              image: { src: heartRate, alt: "Heart rate detail screen with a live animated reading", width: 214 },
            },
            {
              index: "04",
              category: "Personalisation",
              title: "Make the watch yours.",
              body: "A simple studio to swap faces, accents and complications. Personalisation was buried in the old app; here it becomes a first-class place to play.",
              image: { src: watchfaceStudio, alt: "Watch face studio for swapping faces, accents and complications", width: 214 },
            },
            {
              index: "05",
              category: "Social",
              title: "Better with a crew.",
              body: "Step challenges, a shared leaderboard and a little friendly pressure. Research was clear that social accountability keeps people moving, so it earned a pillar of its own.",
              image: { src: fitCrew, alt: "Fit Crew social challenges and leaderboard screen", width: 214 },
            },
          ],
        },
      ],
    },

    // 8 — Before → After
    {
      id: "before-after",
      index: "07",
      eyebrow: "Before → After",
      title: "Same data. New clarity.",
      lead: "The information didn't change — the hierarchy did. Screen by screen, each one earns its colour and gives your day room to breathe.",
      glow: { text: "clarity", bottom: "-15px", right: "38px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "beforeAfter",
          pairs: [
            {
              title: "Home",
              tag: "Midnight Ember",
              before: { src: beforeHome, alt: "The old boAt Crest home screen, a flat wall of cards", height: 280 },
              after: { src: home, alt: "Redesigned home screen with one clear hierarchy", height: 280 },
              changes: [
                { emphasis: "One clear hierarchy", rest: "— weight and colour rank your day, not a flat wall of cards" },
                { emphasis: "No upsell nags", rest: "— the coin prompts and profile pushes are gone" },
                { emphasis: "Four-tab nav", rest: "— five vague destinations became four clear pillars" },
              ],
            },
            {
              title: "Activity",
              tag: "Midnight Ember",
              before: { src: beforeActivity, alt: "The old activity screen with a single gauge", height: 280 },
              after: { src: activityDetail, alt: "Redesigned activity screen showing rings, steps and weekly trends", height: 280 },
              changes: [
                { emphasis: "Rings & steps at a glance", rest: "— the day reads in a second, not a single gauge" },
                { emphasis: "Trends, not a snapshot", rest: "— a week of bars instead of one number" },
                { emphasis: "Colour that means something", rest: "— accent reserved for what actually matters" },
              ],
            },
            {
              title: "Vitals",
              tag: "Midnight Ember",
              before: { src: beforeVitals, alt: "The old vitals screen", height: 280 },
              after: { src: vitalsHub, alt: "Redesigned vitals hub bringing heart, SpO₂ and sleep together", height: 280 },
              changes: [
                { emphasis: "One calm hub", rest: "— heart, SpO₂ and sleep, finally together" },
                { emphasis: "Honest ranges", rest: "— context that reassures instead of alarms" },
                { emphasis: "Tap into any metric", rest: "— every reading opens its own detail" },
              ],
            },
          ],
        },
      ],
    },

    // 9 — Reflection
    {
      id: "reflection",
      index: "08",
      eyebrow: "Reflection",
      title: "What I learned, and what I'd test next.",
      lead: [
        "Redesigning a shipped app meant respecting what already worked while being honest about what didn't. The biggest lesson was ",
        { b: "restraint" },
        " — the hardest cuts, the upsell nags and the fifth tab, did the most for clarity. The rating moving from ",
        { b: "2.3 to 4.2" },
        " told me the hardware was never the problem; the experience was.",
      ],
      glow: { text: "next", top: "24px", right: "40px", size: "clamp(5rem, 11vw, 9rem)" },
      blocks: [
        {
          kind: "principleCards",
          heading: "What I'd test next",
          subhead: "Three bets I'd want real-world data on before calling it done.",
          cards: [
            {
              index: "01",
              title: "Onboarding activation",
              body: "Measure how far the guided setup lifts day-one activation against the old drop-into-home flow.",
            },
            {
              index: "02",
              title: "Social retention",
              body: "Watch whether Fit Crew challenges hold 30-day retention, and tune the nudges that risk feeling like pressure.",
            },
            {
              index: "03",
              title: "Daybreak in the wild",
              body: "Ship light mode to a cohort and check real-world legibility outdoors, where most glances actually happen.",
            },
          ],
        },
        { kind: "closingLine", text: "Good products are never finished — they're just worth opening again." },
      ],
    },
  ],
};

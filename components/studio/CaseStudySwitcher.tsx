"use client";

// Jump between case studies from inside the editor.
//
// ---- THIS WAS A NATIVE <select>, AND THAT REASONING IS KEPT RATHER THAN DELETED (#251) ------
//
// WHAT THIS HEADER SAID, AND WHY IT WAS RIGHT WHEN IT WAS WRITTEN: "A native <select> on purpose:
// it is keyboard- and screen-reader-correct for free, it cannot trap focus, and on mobile it gets
// the platform picker. A custom menu would be more styleable and strictly worse at all three."
//
// TWO OF THE THREE NO LONGER HOLD, because `ListboxField` is not a generic custom menu:
//   - FREE ACCESSIBILITY — it writes the whole surface itself: arrows, Home/End, Enter/Space,
//     Escape, the aria roles and state, and the active-descendant relationship.
//   - CANNOT TRAP FOCUS — focus NEVER LEAVES THE TRIGGER. Options are non-focusable
//     `role="option"` divs and the trigger is the only tab stop, so there is nothing to trap.
//
// THE THIRD IS A REAL COST, AND IT IS LARGER HERE THAN AT THE FOUR FORM FIELDS. The platform
// picker on touch is gone, and this is chrome on every case-study page — the control most likely
// to be reached on a phone, and /studio does render below `lg`. Accepted deliberately, to buy one
// visual language for every select in the studio. **If it turns out worse on a phone, RESTORE
// `SelectField` from 2ebe6b9 rather than rebuilding it** — the exact command is in ListboxField's header.
//
// ---- FOUR THINGS THIS CONTROL NEEDS THAT THE FOUR FORM FIELDS DO NOT ------------------------
//
// 1. ITS OPTIONS ARE DERIVED, not a fixed const — they are whichever studies exist. The shared
//    API takes `readonly T[]` plus an `optionLabel`, so the SLUG is the value and the title is the
//    label, and the `{slug,title}` pairs are adapted HERE rather than by widening a shared
//    component for one consumer. A value outside the set resolves to index 0
//    (`Math.max(0, indexOf)`) rather than throwing — reachable only mid-delete, since `current`
//    comes from the route.
//
// 2. IT NAVIGATES RATHER THAN SETTING A VALUE. `onChange` is a `router.push`, which is why
//    `commit()` closes and re-focuses the trigger BEFORE firing it. That order is correct for all
//    six consumers — a panel open while the value changes underneath is always wrong — but this is
//    the one where it is VISIBLE, because the page moves. Focus lands on the trigger, which this
//    component owns, so the navigation cannot leave it on a detached node.
//
// 3. ITS GROUND IS CREAM, NOT INK. This renders in the case-study editor's OWN header row
//    (`SectionsEditPanel`), measured cream-200 behind a cream-50 pill; the ink topbar is a
//    separate row above it. So both halves of the control sit on one ground and ListboxField's
//    existing cream measurements carry over — this is NOT an instance of the ratio-belongs-to-its-
//    ground rule, though both halves were measured again to establish that.
//
// 4. ITS PANEL OPENS INTO THE PAGE — a third scroll regime after the inspector aside and the
//    canvas slot. The nearest scroller is BODY, with 305–705px of room below across viewport
//    heights, so it never flips and never reaches the cap.
//
// THE LABEL IS `sr-only` HERE. Every other consumer is a field in a column where an eyebrow label
// belongs; this is chrome in a flex row, where one would read as a stray form label in the
// topbar. The span still exists because `aria-labelledby` points at it.
//
// ONE VISIBLE CHANGE WORTH NAMING: the title was `font-display text-base` and is now the shared
// trigger's `text-[14px]` body face. That is the migration doing its job — one language — but it
// is a typographic change to the editor header, not just a mechanism swap.
import { useRouter } from "next/navigation";
import { ListboxField } from "./ListboxField";

export default function CaseStudySwitcher({
  current,
  options,
}: {
  current: string;
  options: { slug: string; title: string }[];
}) {
  const router = useRouter();

  return (
    // The trigger is `w-full`, so the width is capped HERE: this is chrome in a flex row, not a
    // field in a column that should stretch. `min-w-0` keeps a long title truncating inside the
    // header rather than pushing the row wide — the job the old wrapper's `min-w-0` did.
    <div className="min-w-0 max-w-[260px]">
      <ListboxField
        label="Switch case study"
        labelHidden
        value={current}
        options={options.map((o) => o.slug)}
        optionLabel={(slug) => options.find((o) => o.slug === slug)?.title ?? slug}
        onChange={(slug) => router.push(`/studio/projects/${slug}`)}
      />
    </div>
  );
}

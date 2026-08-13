"use client";

// SK-3b — the Skills category editor. The skills singleton is edited as a WHOLE
// (one categories array, saved as one patch via the SK-2 path). This holds the
// whole array in ONE useDraftForm and renders it through ListDetailLayout's
// dynamic-list capability (SK-3a): one list item per category, a pane per
// category (name + items), Add/Remove category via onAddItem/onRemoveItem.
//
// Client-only stable ids live OUTSIDE the form values (a parallel array, aligned
// by index) so useDraftForm's T is exactly the id-less POST shape — no stripping,
// no casts. The ids give the list stable keys so renaming a category never
// remounts its panel. Only add/remove touch both arrays (kept in one batch).
//
// Rendered by /studio/skills (app/studio/(dashboard)/skills/page.tsx).
import { autosaveTitle } from "@/lib/studio/studio-copy";
import { useRef, useState } from "react";
import { ListDetailLayout, useListItem } from "./ListDetailLayout";
import SaveBar from "./SaveBar";
import { moveIn } from "./useItemList";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useReportCount } from "./StudioCountsProvider";
import { IconLayers } from "./icons";
import { inputClsMd, labelCls, FIELD_MEASURE , FieldKey} from "./blocks/fields";

export type Skill = { name: string; glow: string };
export type SkillsCategoryInput = { category: string; items: Skill[] };
type SkillsFields = { categories: SkillsCategoryInput[] };

/* ⚠ A SKILL IS DROPPED ON A BLANK **NAME**, NOT A BLANK GLOW. An empty glow is a defined state —
 * the ghost word simply stays on whatever it was — so trimming rows by "any field empty" would
 * silently delete every skill the owner had not yet given a word to, which is most of them the
 * moment this field ships. */
const trimItems = (items: Skill[]): Skill[] =>
  items.map((i) => ({ name: i.name.trim(), glow: i.glow.trim() })).filter((i) => i.name !== "");
/* ⚠ BOTH FIELDS COMPARED. A name-only comparison would make an edit to a glow word invisible to
 * `isDirty`, so the panel would save nothing and report nothing — the silent no-save shape this
 * repo already paid for once, in this same studio's blog status control. */
const sameItems = (a: Skill[], b: Skill[]) =>
  a.length === b.length && a.every((v, i) => v.name === b[i].name && v.glow === b[i].glow);
// Array-aware, comparing TRIMMED items (the Process sameStages pattern) so a
// mid-typing empty item row is not dirty while a rename / reorder / real edit is.
const sameCategories = (a: SkillsCategoryInput[], b: SkillsCategoryInput[]) =>
  a.length === b.length &&
  a.every((c, i) => c.category === b[i].category && sameItems(trimItems(c.items), b[i].items));

// Trim each category's items and DROP fully-blank categories (no name AND no
// items). Used by BOTH buildCommitted and isDirty (About's trimChips discipline),
// so a category the owner added but never filled is neither committed to the draft
// nor counted as dirty — otherwise the next blur would commit an empty
// { category: "", items: [] } row.
const nonBlankCategories = (cats: SkillsCategoryInput[]) =>
  cats
    .map((c) => ({ category: c.category, items: trimItems(c.items) }))
    .filter((c) => c.category.trim() !== "" || c.items.length > 0);

export default function SkillsEditor({ categories }: { categories: SkillsCategoryInput[] }) {
  // Report differs + pending up to the page Publish bar, exactly like every other
  // studio editor (Hero/About/Links/Process/Experience/Projects).
  const { setUnpublished } = usePublishSignal();

  const initial: SkillsFields = { categories };
  const { values, setField, dirty, saveStatus, savedAt, saveDraft } = useDraftForm<SkillsFields>({
    toastLabel: "Skills",
    initial,
    // The whole categories array IS the patch, posted as
    // { singleton:"skills", patch:{ categories } } (the SK-2 path). nonBlankCategories
    // trims items and drops fully-blank categories, so an added-but-unfilled category
    // is never committed to the draft.
    buildCommitted: (v) => ({ categories: nonBlankCategories(v.categories) }),
    isDirty: (v, b) => !sameCategories(nonBlankCategories(v.categories), b.categories),
    // syncValuesOnSave stays false (it would desync the parallel `ids` array). A
    // blank category row you added stays visible in the UI until you fill or remove
    // it, but nonBlankCategories keeps it out of BOTH the committed patch and the
    // dirty check, so adding a row never commits an empty category on the next blur.
    saveExtras: { singleton: "skills" },
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  // THE SIDEBAR BADGE COUNTS CATEGORIES, NOT INDIVIDUAL SKILLS — the owner's decision, and the
  // reason this reports `values.categories.length` rather than a sum over `items`. Reported
  // from the LIVE form values, like every other list editor, so adding or removing a category
  // moves the badge before the save lands. On mount it equals the server seed, and
  // useReportCount's guard makes that a no-op, so there is no flash.
  useReportCount("skills", values.categories.length);

  // Client-only stable ids, aligned by index with values.categories. Deterministic
  // initial ids (c0, c1, …) so SSR and the client first render agree; a ref counter
  // mints ids for added categories. Only add/remove change this array.
  const nextId = useRef(categories.length);
  const [ids, setIds] = useState<string[]>(() => categories.map((_, i) => `c${i}`));

  const cats = values.categories;
  const updateCat = (id: string, patch: Partial<SkillsCategoryInput>) => {
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    setField("categories", cats.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  // SK-3a dynamic-list props — add/remove touch BOTH arrays in one batch so they
  // stay index-aligned.
  const onAddItem = () => {
    const id = `c${nextId.current++}`;
    setField("categories", [...cats, { category: "", items: [] as Skill[] }]);
    setIds((prev) => [...prev, id]);
    return id; // ListDetailLayout selects the new category
  };
  const onRemoveItem = (id: string) => {
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    setField("categories", cats.filter((_, i) => i !== idx));
    setIds((prev) => prev.filter((x) => x !== id));
  };
  // Reorder. Unlike projects/experience — where order lives in a per-file
  // orderIndex and needs its own commit — a category's position IS its index in
  // this array, so a move is an ordinary field edit: it goes dirty and commits
  // through the same save as a rename or an item edit. Both arrays move together
  // to keep the id-lockstep.
  const onMoveItem = (id: string, direction: "up" | "down") => {
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    const dir = direction === "up" ? -1 : 1;
    if (idx + dir < 0 || idx + dir >= cats.length) return;
    setField("categories", moveIn(cats, idx, dir));
    setIds((prev) => moveIn(prev, idx, dir));
  };

  return (
    // ---- THIS WRAPPER HAS TO CARRY THE HEIGHT, OR THE SHELL INSIDE IT NEVER GETS ONE -------
    //
    // `data-studio-fullheight` was present here and the layout's `:has()` rule DID match — and
    // the rail was still 489px in a 1054px viewport, because the chain broke one level ABOVE the
    // shell. This div is a flex item of `<main>`; without `flex-1 min-h-0` it takes content
    // height, so the shell it contains has only content height to fill.
    //
    // Experience does not need this because `ExperienceListEditor` renders `ListDetailLayout` as
    // the route's own child. The moment a page puts anything BESIDE the shell — here, the
    // document-level save bar below — the wrapper becomes load-bearing.
    //
    // `lg:` to match both of the layout's rules; below `lg` this is ordinary document flow.
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <ListDetailLayout
        sections={cats.map((c, i) => ({ id: ids[i], name: c.category.trim() || "Untitled category" }))}
        onAddItem={onAddItem}
        addItemLabel="Add category"
        searchPlaceholder="Search categories"
        onRemoveItem={onRemoveItem}
        onMoveItem={onMoveItem}
        /* ⚠ THE BAR MOVED INTO THE DETAIL COLUMN AND IT IS NO LONGER A SIBLING OF THE LAYOUT.
           As a sibling it ran the whole page — measured 1342px at a 1600px viewport, spanning
           the 300px list rail — while Experience's bar, which sits inside its own panel, ran
           1042. Two bars on one shell at two widths, and the rail one was the odd one.
           #229's ARGUMENT IS UNCHANGED AND STILL LOAD-BEARING: `skills` is a SINGLETON, one
           `useDraftForm` over every category and one `buildCommitted` that posts them together,
           so there is ONE save for N CategoryPanels. Putting a bar inside each panel would
           render N of them for that one save. This slot is the layout's, not a panel's, which
           is the distinction that lets the bar be column-width without becoming per-entry. */
        footer={
          <SaveBar
            className="sticky bottom-0 z-10 mt-auto"
            status={saveStatus}
            dirty={dirty}
            savedAt={savedAt}
            title={autosaveTitle("Publish from the Hero panel.")}
            primary={{
              label: "Save draft",
              onClick: saveDraft,
              disabled: !dirty || saveStatus === "saving",
              title: "Saves every category together — skills is one document, not one entry per category.",
            }}
          />
        }
      >
        {cats.map((c, i) => (
          <CategoryPanel
            key={ids[i]}
            id={ids[i]}
            category={c.category}
            items={c.items}
            isOnlyCategory={cats.length === 1}
            onName={(name) => updateCat(ids[i], { category: name })}
            onItems={(items) => updateCat(ids[i], { items })}
            onBlurSave={saveDraft}
          />
        ))}
      </ListDetailLayout>

    </div>
  );
}

function CategoryPanel({
  id,
  category,
  items,
  isOnlyCategory,
  onName,
  onItems,
  onBlurSave,
}: {
  id: string;
  category: string;
  items: Skill[];
  isOnlyCategory: boolean;
  onName: (name: string) => void;
  onItems: (items: Skill[]) => void;
  onBlurSave: () => void;
}) {
  const { isSelected } = useListItem(id, false);
  if (!isSelected) return null; // stays MOUNTED; state is lifted, so nothing is lost

  return (
    <section
      aria-label={`Edit ${category.trim() || "category"}`}
      // THE FIELD SURFACE IS cream-100, matching the five sibling entry panels. Measured, this
      // panel was cream-50 holding an `inputClsMd` name field and a ChipListEditor, both
      // cream-50 — a 1.00 ratio. The ladder is relational (blocks/fields.tsx:151-166) and
      // cream-50 is its bottom step, so the panel moves, not the fields.
      // NO FRAME — the same removal #245 made on the five sibling panels, which MISSED this one.
      // #245 swept BY PANEL NAME (About, Experience, Hero, Links, Process) and this panel is
      // `CategoryPanel` inside `SkillsEditor`, so it was never in the list and the exact string
      // survived here. `studio-ink` E1b already derived the SHELL consumers from the files that
      // render `<ListDetailLayout`; the frame removal did not derive anything. See E1c, which
      // now derives the panel set the same way the shell set is derived.
      className="bg-studio-cream-100"
    >
      {/* A CREAM-200 BAR, NOT AN INK BAND, and that is the by-role rule rather than a
          preference. The ink band's own reasoning is about a NARROW PANE beside ink chrome,
          where it anchors the inspector to the sidebar; this is a full-width form on a cream
          page, where a band would be a slab of ink mid-page. Inspector pane -> ink band; entry
          panel -> cream-200 bar. This panel was the only one of seven with NO header at all.
          NO DIRTY PILL AND NO CANCEL, unlike the five siblings, and that follows from the same
          architecture as the footer below: `skills` is a singleton, so dirty is a property of
          the DOCUMENT, not of one category. It is reported once, in the footer. A pill here
          would claim per-category dirty state that does not exist. */}
      <header className="flex items-center justify-between gap-3 border-b border-studio-ink-950/12 bg-studio-cream-200 px-4 py-[19px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500/10 text-studio-accent-500 [&>svg]:size-3.5">
            <IconLayers />
          </span>
          <span className="truncate font-display text-base text-studio-ink-950">
            {category.trim() || "Untitled category"}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <FieldKey>Category name</FieldKey>
          <input
            type="text"
            value={category}
            onChange={(e) => onName(e.target.value)}
            onBlur={onBlurSave}
            placeholder="e.g. Design"
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Skills in this category</span>
          {/* ⚠ A ROW LIST RATHER THAN THE CHIP EDITOR, BECAUSE A SKILL NOW CARRIES TWO FIELDS.
              `ChipListEditor` edits `string[]` and every other consumer still does; widening it to
              take a second field would push a skills-shaped concept into a component four panels
              share. The rows below are local to this panel and reuse its own input classes, so the
              chrome matches without the abstraction moving. */}
          <div className="flex flex-col gap-1.5">
            {items.map((sk, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={sk.name}
                  onChange={(e) => onItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  onBlur={onBlurSave}
                  placeholder="Skill"
                  aria-label={`Skill ${i + 1} name`}
                  className={`${inputClsMd} ${FIELD_MEASURE} flex-1`}
                />
                <input
                  type="text"
                  value={sk.glow}
                  onChange={(e) => onItems(items.map((x, j) => (j === i ? { ...x, glow: e.target.value } : x)))}
                  onBlur={onBlurSave}
                  placeholder="Glow word"
                  aria-label={`Skill ${i + 1} glow word`}
                  className={`${inputClsMd} ${FIELD_MEASURE} w-[132px]`}
                />
                <button
                  type="button"
                  onClick={() => { onItems(items.filter((_, j) => j !== i)); onBlurSave(); }}
                  aria-label={`Remove skill ${sk.name || i + 1}`}
                  className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-2 py-1.5 text-[11px] text-studio-ink-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onItems([...items, { name: "", glow: "" }])}
              className="w-max rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-2.5 py-1.5 text-[11px] text-studio-ink-800"
            >
              Add skill
            </button>
            {/* ⚠ THE GLOW IS EXPLAINED WHERE IT IS TYPED. Nothing on this panel shows the homepage's
                ghost word, so a bare "Glow word" input is a field with no visible consequence — the
                shape an owner fills wrongly or leaves blank without knowing either was a choice. */}
            <span className="text-[10px] text-studio-ink-600">
              The glow word fades in behind the pills when someone hovers that skill. Leave it empty
              and the previous word stays put.
            </span>
          </div>
          {items.length === 0 && (
            <span className="text-[10px] text-studio-accent-600">
              This category has no skills — it will show an empty section on your site.
            </span>
          )}
        </div>

        {isOnlyCategory && (
          <p className="rounded-[var(--studio-radius-control,4px)] border border-studio-accent-500/25 bg-studio-accent-500/5 px-3 py-2 text-[12px] text-studio-accent-600">
            This is your only category. Removing it leaves no skills — the Skills section won&rsquo;t render on your site.
          </p>
        )}
      </div>
    </section>
  );
}

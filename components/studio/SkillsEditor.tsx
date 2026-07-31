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
import { useRef, useState } from "react";
import { ListDetailLayout, useListItem } from "./ListDetailLayout";
import ChipListEditor from "./ChipListEditor";
import { moveIn } from "./useItemList";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useReportCount } from "./StudioCountsProvider";
import { inputClsMd, labelCls } from "./blocks/fields";

export type SkillsCategoryInput = { category: string; items: string[] };
type SkillsFields = { categories: SkillsCategoryInput[] };

const trimItems = (items: string[]) => items.map((i) => i.trim()).filter(Boolean);
const sameItems = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
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
  const { values, setField, dirty, saveStatus, saveDraft } = useDraftForm<SkillsFields>({
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
    setField("categories", [...cats, { category: "", items: [] }]);
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

  const statusText =
    saveStatus === "saving"
      ? "Saving draft…"
      : saveStatus === "saved"
        ? "Draft saved"
        : saveStatus === "error"
          ? "Save failed. Try again."
          : saveStatus === "fs"
            ? "Draft save needs github mode (dev)"
            : dirty
              ? "Unsaved changes"
              : "All changes saved";

  return (
    <div className="flex flex-col gap-4">
      <ListDetailLayout
        sections={cats.map((c, i) => ({ id: ids[i], name: c.category.trim() || "Untitled category" }))}
        onAddItem={onAddItem}
        addItemLabel="Add category"
        onRemoveItem={onRemoveItem}
        onMoveItem={onMoveItem}
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

      <footer className="flex items-center justify-between gap-3 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-100 px-4 py-3">
        <span className="text-[12px] text-text-subtle" aria-live="polite">
          {statusText}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving"}
          className="rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
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
  items: string[];
  isOnlyCategory: boolean;
  onName: (name: string) => void;
  onItems: (items: string[]) => void;
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
      className="overflow-hidden rounded-[var(--studio-radius-panel,12px)] border border-accent-500/30 bg-cream-100"
    >
      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Category name</span>
          <input
            type="text"
            value={category}
            onChange={(e) => onName(e.target.value)}
            onBlur={onBlurSave}
            placeholder="e.g. Design"
            className={inputClsMd}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Skills in this category</span>
          <ChipListEditor chips={items} onChange={onItems} onBlur={onBlurSave} addLabel="Add skill" placeholder="Skill" />
          {items.length === 0 && (
            <span className="text-[10px] text-accent-600">
              This category has no skills — it will show an empty section on your site.
            </span>
          )}
        </div>

        {isOnlyCategory && (
          <p className="rounded-[var(--studio-radius-control,4px)] border border-accent-500/25 bg-accent-500/5 px-3 py-2 text-[12px] text-accent-600">
            This is your only category. Removing it leaves no skills — the Skills section won&rsquo;t render on your site.
          </p>
        )}
      </div>
    </section>
  );
}

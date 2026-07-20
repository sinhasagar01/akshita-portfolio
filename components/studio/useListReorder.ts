"use client";

// Reorder for a slug-keyed collection list, shared by ProjectsListEditor and
// ExperienceListEditor — the two are identical here (same route, same optimistic
// shape, same revert), unlike their add/delete flows, which genuinely differ.
//
// OPTIMISTIC, WITH A REAL REVERT. The move lands in local state immediately so
// the list does not lurch while a commit round-trips, and the PREVIOUS array is
// captured so a failed commit puts the list back exactly as it was rather than
// leaving the UI claiming an order the draft branch does not have.
//
// It posts the FULL order, not the swap. The server assigns orderIndex from the
// array position, so the request can only express a permutation and the stored
// indices come out a clean 0..N-1.
import { useRef, useState } from "react";
import { moveIn } from "./useItemList";
import { usePublishSignal } from "./PublishProvider";

export function useListReorder<T extends { slug: string }>({
  collection,
  items,
  setItems,
}: {
  collection: "projects" | "experience";
  items: readonly T[];
  setItems: (next: T[]) => void;
}) {
  const { setUnpublished } = usePublishSignal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Serializes moves: a second click while a commit is in flight would compute
  // its order from state the server has not seen yet.
  const busyRef = useRef(false);

  async function moveItem(id: string, direction: "up" | "down") {
    if (busyRef.current) return;
    const i = items.findIndex((x) => x.slug === id);
    const dir = direction === "up" ? -1 : 1;
    if (i === -1 || i + dir < 0 || i + dir >= items.length) return;

    const previous = [...items];
    const next = moveIn(items, i, dir);
    setItems(next);
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/reorder-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, slugs: next.map((x) => x.slug) }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setItems(previous);
        setError("Reorder needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok) {
        // saved === false means the order already matched — nothing committed, so
        // there is nothing new to publish.
        if (json.saved) setUnpublished(true);
        return;
      }
      setItems(previous);
      setError("Could not save the new order. Try again.");
    } catch {
      setItems(previous);
      setError("Could not save the new order. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return { moveItem, reorderBusy: busy, reorderError: error };
}

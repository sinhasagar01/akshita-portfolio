import { cache } from "react";
import { getHomePageData } from "@/lib/keystatic";

// Dedupe the studio data read at the studio boundary. The studio layout reads
// it for the sidebar counts and each area page reads it for its cards, so within
// a single request they all share one underlying read of the same payload.
// lib/keystatic.ts stays untouched — the wrapper lives only here.
export const getStudioData = cache(getHomePageData);

// The studio page wrapper's padding, in ONE place.
//
// This used to live on a single wrapper in app/studio/(dashboard)/layout.tsx, as
// the page padding plus a sibling 5rem tail spacer that kept the fixed PublishBar off the end of
// the content. Both assumed every studio page wants a padded, page-scrolled column. The
// blog editor is a full-height 3-pane layout whose panes scroll internally and which must
// reach the viewport edges, so the assumption is now false and the shared wrapper is gone.
//
// Each page opts IN by spreading this on its root. The blog editor simply does not, which
// is why it needs no negative margins to escape anything. `pb-24` folds in the old spacer
// (96px clears the bar's 46px height plus its 20px bottom offset with room to spare).
export const STUDIO_PAGE = "p-4 pb-24 lg:p-6";

// A studio empty-state card, shown when a singleton's content file is absent.
//
// It once deep-linked into Keystatic (GH-12); that went away with the Keystatic
// retirement. In practice these never render — content/site-settings.yaml and
// content/skills.yaml always exist in the repo — so this is purely a defensive
// message for a missing content file, which is a repo concern, not an owner action.
type Props = {
  children: React.ReactNode;
};

export default function StudioEmptyState({ children }: Props) {
  return (
    <div className="block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600">
      <p>{children}</p>
    </div>
  );
}

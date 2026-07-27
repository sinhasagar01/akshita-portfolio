type Props = { label: string };

export default function ImagePlaceholder({ label }: Props) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2"
    >
      <div className="absolute inset-[6px] rounded-sm border border-dashed border-[--color-border] opacity-50" />
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="relative text-[--color-text-muted] opacity-40"
      >
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 17l5-5 4 4 3-3 5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-[11px] font-mono text-[--color-text-muted] opacity-50 select-none tracking-wide">
        {label}
      </span>
    </div>
  );
}

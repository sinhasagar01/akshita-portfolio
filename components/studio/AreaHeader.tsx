type Props = {
  title: string;
  sub?: string;
};

/** The area title (h1) and subline, shared by every studio area page. */
export default function AreaHeader({ title, sub }: Props) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-normal leading-tight text-studio-ink-950">
        {title}
      </h1>
      {sub && <p className="mt-1 text-[14px] text-studio-text-subtle">{sub}</p>}
    </div>
  );
}

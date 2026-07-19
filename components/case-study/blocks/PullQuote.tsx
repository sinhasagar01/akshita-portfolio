/** `.pull` — left-bar italic pull quote. Under template=web (CS-7b) the Bold-gallery
 *  serif quote: `dark` renders it on the dark band (on-dark-quote), otherwise the
 *  inline light serif (accent). Mobile keeps the left-bar quote, byte-identically. */
export default function PullQuote({
  text,
  web = false,
  dark = false,
}: {
  text: string;
  web?: boolean;
  dark?: boolean;
}) {
  if (web && dark) {
    return (
      <p className="font-display italic font-normal text-[clamp(1.5rem,2.6vw,1.875rem)] text-on-dark-quote leading-[1.35] max-w-[720px]">
        {text}
      </p>
    );
  }
  if (web) {
    return (
      <p className="font-display italic font-normal text-[clamp(1.375rem,2.4vw,1.75rem)] text-accent-600 leading-[1.3] max-w-[760px]">
        {text}
      </p>
    );
  }
  return (
    <p className="relative font-display italic font-normal text-[34px] text-ink-950 leading-[1.22] max-w-[880px] pl-7">
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-sm bg-accent-500"
      />
      {text}
    </p>
  );
}

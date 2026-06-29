/** `.pull` — left-bar italic pull quote. */
export default function PullQuote({ text }: { text: string }) {
  return (
    <p className="relative font-display italic font-normal text-3xl text-ink-950 leading-[1.22] max-w-[880px] pl-7">
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-sm bg-accent-500"
      />
      {text}
    </p>
  );
}

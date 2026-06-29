/** A warm italic closing statement. */
export default function ClosingLine({ text }: { text: string }) {
  return (
    <p className="font-display italic font-normal text-[34px] text-accent-600 leading-[1.3] max-w-[34ch]">
      {text}
    </p>
  );
}

/** A warm italic closing statement. Under template=web (CS-7b), the Bold-gallery
 *  closing: the same serif line, centered. Mobile is left-aligned, byte-identically. */
export default function ClosingLine({ text, web = false }: { text: string; web?: boolean }) {
  if (web) {
    return (
      <p className="font-display italic font-normal text-[34px] text-accent-600 leading-[1.3] max-w-[34ch] mx-auto text-center">
        {text}
      </p>
    );
  }
  return (
    <p className="font-display italic font-normal text-[34px] text-accent-600 leading-[1.3] max-w-[34ch]">
      {text}
    </p>
  );
}

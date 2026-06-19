import Image from "next/image";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Reveal from "@/components/motion/Reveal";
import type { ImageGalleryData } from "@/lib/keystatic";

type Props = { data: ImageGalleryData["value"] };

export default function ImageGalleryBlock({ data }: Props) {
  const slots = [data.image1, data.image2, data.image3];
  const filledCount = slots.filter(Boolean).length;

  function renderSlot(src: string | null, label: string, className: string, sizes: string) {
    return (
      <div className={`relative rounded-[--radius-md] overflow-hidden bg-[--color-surface] ${className}`}>
        {src ? (
          <Image src={src} alt="" fill className="object-cover" sizes={sizes} />
        ) : (
          <ImagePlaceholder label={label} />
        )}
      </div>
    );
  }

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          {filledCount === 0 && (
            <div className="grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
              {renderSlot(null, "1200 × 900", "col-span-4 md:col-span-8 aspect-[4/3]", "(max-width: 768px) 100vw, 67vw")}
              <div className="col-span-4 md:col-span-4 flex flex-col gap-8 md:gap-12">
                {renderSlot(null, "800 × 800", "aspect-square", "(max-width: 768px) 100vw, 33vw")}
                {renderSlot(null, "800 × 800", "aspect-square", "(max-width: 768px) 100vw, 33vw")}
              </div>
            </div>
          )}

          {filledCount === 1 && (
            renderSlot(slots[0], "1920 × 1080", "aspect-[16/9]", "(max-width: 768px) 100vw, 85vw")
          )}

          {filledCount === 2 && (
            <div className="grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
              {slots.slice(0, 2).map((src, i) => (
                <div key={i} className="col-span-4 md:col-span-6">
                  {renderSlot(src, "1200 × 900", "aspect-[4/3]", "(max-width: 768px) 100vw, 50vw")}
                </div>
              ))}
            </div>
          )}

          {filledCount >= 3 && (
            <div className="grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
              {renderSlot(slots[0], "1200 × 900", "col-span-4 md:col-span-8 aspect-[4/3]", "(max-width: 768px) 100vw, 67vw")}
              <div className="col-span-4 md:col-span-4 flex flex-col gap-8 md:gap-12">
                {slots.slice(1, 3).map((src, i) => (
                  <div key={i}>
                    {renderSlot(src, "800 × 800", "aspect-square", "(max-width: 768px) 100vw, 33vw")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.caption && (
            <p className="text-sm text-[--color-text-muted] leading-[--leading-normal] mt-4">
              {data.caption}
            </p>
          )}
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}

import Image from "next/image";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { ImageGalleryData } from "@/lib/keystatic";

type Props = { data: ImageGalleryData["value"] };

export default function ImageGalleryBlock({ data }: Props) {
  if (!data.image1) return null;

  const images = [data.image1, data.image2, data.image3].filter(Boolean) as string[];

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          {images.length === 1 && (
            <div className="relative aspect-[16/9] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
              <Image
                src={images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 85vw"
              />
            </div>
          )}
          {images.length === 2 && (
            <div className="grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
              {images.map((src, i) => (
                <div key={i} className="col-span-4 md:col-span-6 relative aspect-[4/3] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
                  <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              ))}
            </div>
          )}
          {images.length >= 3 && (
            <div className="grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
              <div className="col-span-4 md:col-span-8 relative aspect-[4/3] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
                <Image src={images[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 67vw" />
              </div>
              <div className="col-span-4 md:col-span-4 flex flex-col gap-8 md:gap-12">
                {images.slice(1, 3).map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
                    <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
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

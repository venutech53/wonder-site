"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { spaces } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SpaceSlider } from "@/components/ui/SpaceSlider";
import { Button } from "@/components/ui/Button";
import { RotatingBadge } from "@/components/ui/RotatingBadge";
import { paperTexture } from "@/lib/texture";

type SpaceItem = (typeof spaces.items)[number];

function SpaceDetails({ item, footnote }: { item: SpaceItem; footnote?: string }) {
  return (
    <div className="flex flex-col gap-8 2xl:gap-10 motion-safe:animate-[space-in_450ms_cubic-bezier(0.16,1,0.3,1)]">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-olive lg:hidden">{item.nav}</p>
        <h2 className="text-[32px] font-bold uppercase leading-[1.05] tracking-tight text-ink 2xl:text-[44px]">
          {item.heading}
        </h2>
        <p className="max-w-[46ch] text-[17px] leading-[1.6] text-muted 2xl:text-xl">{item.body}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-ink 2xl:text-base">Included</h3>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {item.amenities.map((amenity) => (
            <li key={amenity} className="flex items-start gap-2 text-sm leading-snug text-ink/80 2xl:text-base">
              <Check size={16} strokeWidth={2} className="mt-px shrink-0 text-olive" />
              {amenity}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button href={`/book?space=${item.key}`} className="shrink-0">
          Book Now
        </Button>
        {footnote && <p className="max-w-[30ch] text-[13px] leading-snug text-muted 2xl:text-sm">{footnote}</p>}
      </div>
    </div>
  );
}

export function SpacesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = blockRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToItem = (index: number) => {
    blockRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      data-header-text="ink"
      style={paperTexture("#f2f0e4")}
      className="pt-[106px] pb-24 md:pb-32"
    >
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-0">
        {/* Column A: nav (sticky on desktop, simple heading on mobile) */}
        <div className="px-6 pt-16 md:px-10 md:pt-20 lg:w-[40%] lg:shrink-0 lg:pl-10 lg:pr-12 lg:pt-0">
          <div className="lg:hidden">
            <Eyebrow>{spaces.eyebrow}</Eyebrow>
            <h1 className="mt-3 text-[40px] font-normal leading-[1.15] text-ink">
              {spaces.heading}
            </h1>
          </div>

          <div className="hidden lg:sticky lg:top-[106px] lg:flex lg:h-[calc(100dvh-106px)] lg:flex-col lg:overflow-y-auto lg:py-10 lg:[scrollbar-width:none]">
            <div>
              <Eyebrow>{spaces.eyebrow}</Eyebrow>
              <h1 className="mt-3 text-[40px] font-normal leading-[1.1] text-ink xl:text-[52px] 2xl:text-[68px]">
                {spaces.heading}
              </h1>
            </div>

            <ul className="mt-8 flex flex-col border-l 2xl:mt-12 border-ink/10">
              {spaces.items.map((item, i) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => scrollToItem(i)}
                    aria-current={activeIndex === i}
                    className={`-ml-px w-full border-l-2 py-1.5 pl-4 text-left text-lg 2xl:py-2 2xl:text-2xl transition-colors ${
                      activeIndex === i
                        ? "border-olive font-medium text-ink"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {item.nav}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-ink/10 pt-8 2xl:mt-12 2xl:pt-12">
              <SpaceDetails
                key={spaces.items[activeIndex].key}
                item={spaces.items[activeIndex]}
                footnote={spaces.footnote}
              />
            </div>

            <RotatingBadge className="mt-auto h-24 w-24 shrink-0 pt-0 [@media(max-height:900px)]:hidden" />
          </div>
        </div>

        {/* Space images: full-width, flush right on desktop; details stack below on mobile */}
        <div className="flex flex-1 flex-col lg:border-l lg:border-ink/8">
          {spaces.items.map((item, i) => (
            <div
              key={item.key}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              className={`flex flex-col ${
                i > 0 ? "lg:border-t lg:border-ink/8" : ""
              }`}
            >
              <div className="relative h-[45vh] overflow-hidden lg:h-[calc(100dvh-106px)]">
                <SpaceSlider
                  images={item.images}
                  alt={item.heading}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority={i === 0}
                />
              </div>

              <div className="px-6 py-12 lg:hidden">
                <SpaceDetails item={item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

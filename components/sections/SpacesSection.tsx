"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { spaces } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { RotatingBadge } from "@/components/ui/RotatingBadge";
import { paperTexture } from "@/lib/texture";

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
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        {/* Column A: nav (sticky on desktop, simple heading on mobile) */}
        <div className="px-6 pt-16 md:px-10 md:pt-20 lg:w-1/3 lg:shrink-0 lg:pl-10 lg:pr-0 lg:pt-0">
          <div className="lg:hidden">
            <Eyebrow>{spaces.eyebrow}</Eyebrow>
            <h1 className="mt-3 text-[40px] font-normal leading-[1.15] text-ink">
              {spaces.heading}
            </h1>
          </div>

          <div className="hidden lg:sticky lg:top-[106px] lg:flex lg:h-[calc(100dvh-106px)] lg:flex-col lg:py-20">
            <Eyebrow>{spaces.eyebrow}</Eyebrow>
            <h1 className="mt-3 text-[40px] font-normal leading-[1.15] text-ink md:text-[56px]">
              {spaces.heading}
            </h1>

            <div className="my-auto flex flex-col gap-6">
              <ul className="flex flex-col gap-2">
                {spaces.items.map((item, i) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => scrollToItem(i)}
                      className={`text-left text-lg transition-colors ${
                        activeIndex === i ? "font-bold text-ink" : "text-muted hover:text-ink"
                      }`}
                    >
                      <span
                        className={`mr-2 inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                          activeIndex === i ? "bg-olive" : "bg-transparent"
                        }`}
                      />
                      {item.nav}
                    </button>
                  </li>
                ))}
              </ul>

              <p className="max-w-xs text-sm leading-relaxed text-muted">{spaces.footnote}</p>
            </div>

            <RotatingBadge className="h-32 w-32" />
          </div>
        </div>

        {/* Space blocks: zigzag on desktop, stacked on mobile */}
        <div className="flex flex-1 flex-col lg:border-l lg:border-ink/8">
          {spaces.items.map((item, i) => (
            <div
              key={item.key}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              className={`flex min-h-[100dvh] flex-col lg:items-stretch ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } ${i > 0 ? "lg:border-t lg:border-ink/8" : ""}`}
            >
              <div className="w-full lg:sticky lg:top-[106px] lg:w-1/2">
                <div className="relative h-[45vh] overflow-hidden lg:h-full">
                  <Image
                    src={item.image}
                    alt={item.heading}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex w-full flex-col justify-between gap-10 px-6 py-16 lg:w-1/2 lg:px-16 lg:py-20">
                <div className="flex flex-col gap-4">
                  <Eyebrow>{item.eyebrow}</Eyebrow>
                  <h2 className="text-[32px] font-bold uppercase leading-[1.1] text-ink">
                    {item.heading}
                  </h2>
                  <p className="max-w-md text-base leading-relaxed text-muted">{item.body}</p>

                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {item.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2 text-sm text-muted">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-olive" />
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button href={`/book?space=${item.key}`} className="w-fit">
                  Book Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

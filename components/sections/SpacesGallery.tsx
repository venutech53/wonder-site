"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { spaces } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { paperTexture } from "@/lib/texture";

const ACTIVE_WIDTH = 46;
const RESTING_WIDTH = (100 - ACTIVE_WIDTH) / 3;
const CYCLE_MS = 3000;

function SpaceImage({
  images,
  alt,
  isActive,
  imageIndex,
  sizes,
}: {
  images: string[];
  alt: string;
  isActive: boolean;
  imageIndex: number;
  sizes: string;
}) {
  const showSecond = isActive && imageIndex === 1 && images[1];

  return (
    <>
      <Image
        src={images[0]}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover transition-[opacity,transform] duration-700 ${
          isActive ? "scale-100" : "scale-105"
        } ${showSecond ? "opacity-0" : "opacity-100"}`}
      />
      {images[1] && (
        <Image
          src={images[1]}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-700 ${showSecond ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}

export function SpacesGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  if (activeIndex !== lastActiveIndex) {
    setLastActiveIndex(activeIndex);
    setImageIndex(0);
  }

  const toggle = (i: number) => {
    setActiveIndex((current) => (current === i ? null : i));
  };

  useEffect(() => {
    if (activeIndex === null || reduceMotion) return;
    const id = setInterval(() => setImageIndex((i) => (i === 0 ? 1 : 0)), CYCLE_MS);
    return () => clearInterval(id);
  }, [activeIndex, reduceMotion]);

  return (
    <section data-header-text="ink" style={paperTexture("#f2f0e4")} className="pt-[106px] pb-16 md:pb-20">
      <div className="mx-auto max-w-7xl px-6 pt-16 md:px-10 md:pt-20">
        <Eyebrow>{spaces.eyebrow}</Eyebrow>
        <h1 className="mt-3 max-w-xl text-[32px] font-normal leading-[1.15] text-ink md:text-[40px]">
          Four Spaces, One House
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          A quick look before you book. Hover — or tap on mobile — a space to see what it&apos;s built for, then
          choose your space, date, and package below.
        </p>
      </div>

      {/* Desktop / tablet: horizontal accordion */}
      <div
        className="mx-auto mt-10 hidden h-[60vh] min-h-[460px] max-h-[640px] max-w-7xl gap-1 px-6 md:px-10 lg:flex"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {spaces.items.map((item, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onClick={() => toggle(i)}
              style={{ width: `${activeIndex === null ? 25 : isActive ? ACTIVE_WIDTH : RESTING_WIDTH}%` }}
              className="group relative h-full shrink-0 overflow-hidden text-left transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
              aria-label={`Preview ${item.nav}`}
              aria-expanded={isActive}
            >
              <SpaceImage
                images={item.galleryImages}
                alt={item.heading}
                isActive={isActive}
                imageIndex={imageIndex}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div
                className={`absolute inset-0 bg-charcoal transition-opacity duration-500 ${
                  isActive ? "opacity-15" : "opacity-40"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/10 to-transparent" />

              {/* Collapsed label */}
              <div
                className={`absolute inset-0 flex items-end p-5 transition-opacity duration-300 ${
                  isActive ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <span className="text-sm font-medium uppercase tracking-[0.1em] text-cream-text [writing-mode:vertical-rl]">
                  {item.nav}
                </span>
              </div>

              {/* Expanded content */}
              <div
                className={`absolute inset-x-0 bottom-0 flex flex-col gap-3 p-7 transition-all duration-300 ${
                  isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                }`}
              >
                <Eyebrow tone="cream">{item.eyebrow}</Eyebrow>
                <h2 className="text-2xl font-bold uppercase leading-[1.1] text-cream-text">{item.heading}</h2>
                <p className="max-w-sm text-sm leading-relaxed text-cream-text/80">{item.body}</p>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {item.amenities.slice(0, 3).map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2 text-xs text-cream-text/70">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-cream-text/70" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile: vertical accordion */}
      <div className="mt-10 flex flex-col gap-1 px-6 md:px-10 lg:hidden">
        {spaces.items.map((item, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(i)}
              style={{ height: isActive ? 420 : 96 }}
              className="group relative w-full overflow-hidden text-left transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
              aria-label={`Preview ${item.nav}`}
              aria-expanded={isActive}
            >
              <SpaceImage
                images={item.galleryImages}
                alt={item.heading}
                isActive={isActive}
                imageIndex={imageIndex}
                sizes="100vw"
              />
              <div
                className={`absolute inset-0 bg-charcoal transition-opacity duration-500 ${
                  isActive ? "opacity-15" : "opacity-35"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                <span className="text-sm font-bold uppercase tracking-[0.08em] text-cream-text">{item.nav}</span>
                <div
                  className={`flex flex-col gap-2 transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "pointer-events-none h-0 opacity-0"
                  }`}
                >
                  <p className="max-w-sm text-sm leading-relaxed text-cream-text/80">{item.body}</p>
                  <ul className="flex flex-col gap-1.5">
                    {item.amenities.slice(0, 3).map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2 text-xs text-cream-text/70">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-cream-text/70" />
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

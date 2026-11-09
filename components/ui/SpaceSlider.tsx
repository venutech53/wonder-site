"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";

type SpaceSliderProps = {
  images: string[];
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Native scroll-snap slider: swipe on touch, arrow keys / buttons on desktop.
 * Controls only render when there is more than one image.
 */
export function SpaceSlider({ images, alt, sizes, priority = false, className = "" }: SpaceSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const count = images.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActive(index);
          }
        });
      },
      { root: track, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = (index + count) % count;
      track.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    },
    [count, reduceMotion]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  };

  return (
    <div
      className={`group/slider relative h-full w-full ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div
        ref={trackRef}
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={onKeyDown}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-olive [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt}, view ${i + 1}`}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-charcoal/45 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-6 md:inset-x-8 md:bottom-8">
            <div className="flex flex-1 items-center gap-1.5">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={active === i}
                  className="group/seg flex h-6 max-w-12 flex-1 items-center"
                >
                  <span
                    className={`block h-0.5 w-full rounded-full transition-colors duration-300 ${
                      active === i ? "bg-cream-text" : "bg-cream-text/40 group-hover/seg:bg-cream-text/70"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous image"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-ink transition-[background-color,transform] duration-200 hover:bg-cream active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next image"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-ink transition-[background-color,transform] duration-200 hover:bg-cream active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

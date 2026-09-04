"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Slide = {
  src: string;
  alt: string;
  caption?: string;
};

type SlideshowProps = {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
};

export function Slideshow({ slides, intervalMs = 4500, className = "" }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs, reduceMotion]);

  const slide = slides[index];

  return (
    <div className={`relative h-[320px] w-full overflow-hidden md:h-[420px] ${className}`}>
      <AnimatePresence>
        <motion.div
          key={slide.src}
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-charcoal/60 to-transparent" />

      {slide.caption && (
        <span className="absolute bottom-5 left-6 text-xs font-medium uppercase tracking-[0.1em] text-cream-text md:left-10">
          {slide.caption}
        </span>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-5 right-6 flex gap-2 md:right-10">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-cream-text" : "w-1.5 bg-cream-text/50 hover:bg-cream-text/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

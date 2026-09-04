"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type ImageSliderProps = {
  images: string[];
  alt: string;
  intervalMs?: number;
  className?: string;
};

export function ImageSlider({ images, alt, intervalMs = 4500, className = "" }: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, reduceMotion, images.length, intervalMs]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          animate={{ opacity: index === i ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={src}
            alt={`${alt} ${i + 1}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      ))}

      <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={index === i}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              index === i ? "w-6 bg-cream-text" : "w-1.5 bg-cream-text/50 hover:bg-cream-text/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

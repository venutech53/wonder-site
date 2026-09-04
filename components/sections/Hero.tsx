"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { hero } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const [pastCue, setPastCue] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setPastCue(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      data-header-text="cream"
      className="relative flex h-[100dvh] min-h-[100dvh] w-full items-end overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: reduceMotion ? 1 : 1.04 }}
        transition={{ duration: 8, ease: "linear" }}
      >
        <Image
          src={hero.image}
          alt="A person walking through Wonder's sunlit co-working space"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-charcoal/75 via-charcoal/20 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 md:px-10 md:pb-32">
        <div className="flex max-w-[640px] flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Eyebrow tone="cream">{hero.eyebrow}</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[48px] font-normal uppercase leading-[1.05] text-cream-text md:text-[64px]"
          >
            {hero.headline}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button href="/book">{hero.cta}</Button>
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ opacity: pastCue ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden
      >
        <span className="h-10 w-px bg-cream-text/60" />
      </motion.div>
    </section>
  );
}

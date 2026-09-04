"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, MotionValue } from "framer-motion";
import { scrollStatement } from "@/lib/content";
import { paperTexture } from "@/lib/texture";

const MUTED = "#B9B6A2";
const INK = "#23231F";

function Word({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const color = useTransform(progress, range, [MUTED, INK]);
  return (
    <motion.span style={{ color }} className="inline-block">
      {word}
    </motion.span>
  );
}

function AccentWord({ word }: { word: string }) {
  return <span className="inline-block text-[0.83em] font-script text-olive">{word}</span>;
}

function TagList() {
  return (
    <div className="flex flex-row justify-center gap-4 lg:w-[120px] lg:shrink-0 lg:flex-col lg:justify-start lg:gap-1">
      {scrollStatement.tags.map((tag) => (
        <span
          key={tag}
          className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted md:text-xs"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

const ACCENT_PATTERN = /unfolds|colombo|focus/i;

export function ScrollStatement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const words = scrollStatement.line.split(" ");

  if (reduceMotion) {
    return (
      <section
        data-header-text="ink"
        style={paperTexture("#f2f0e4")}
        className="flex min-h-[60vh] items-center justify-center px-6 py-24 md:px-10"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-16">
          <TagList />
          <p className="max-w-3xl text-center text-[40px] font-normal leading-[1.15] text-ink md:text-left md:text-[56px]">
            {words.map((word, i) => (
              <span key={i}>
                {ACCENT_PATTERN.test(word) ? <AccentWord word={word} /> : word}
                {i < words.length - 1 && " "}
              </span>
            ))}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      data-header-text="ink"
      style={paperTexture("#f2f0e4")}
      className="relative h-[220vh]"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-6 md:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-16">
          <TagList />
          <p className="max-w-3xl text-center text-[40px] font-normal leading-[1.15] md:text-left md:text-[56px]">
            {words.map((word, i) => (
              <span key={i}>
                {ACCENT_PATTERN.test(word) ? (
                  <AccentWord word={word} />
                ) : (
                  <Word
                    word={word}
                    progress={scrollYProgress}
                    range={[i / words.length, (i + 1) / words.length]}
                  />
                )}
                {i < words.length - 1 && " "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

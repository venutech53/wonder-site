"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LogoIdeogram } from "@/components/ui/Logo";

type RotatingBadgeProps = {
  text?: string;
  className?: string;
};

export function RotatingBadge({ text = "Work in Wonder", className = "" }: RotatingBadgeProps) {
  const reduceMotion = useReducedMotion();
  const repeated = `${text} · `.repeat(2);

  return (
    <div className={`relative text-ink ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={reduceMotion ? undefined : { duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path
            id="rotating-badge-path"
            d="M 100,100 m -84,0 a 84,84 0 1,1 168,0 a 84,84 0 1,1 -168,0"
          />
        </defs>
        <text fontSize="22" letterSpacing="0" fill="currentColor" className="uppercase">
          <textPath href="#rotating-badge-path" startOffset="0%">
            {repeated}
          </textPath>
        </text>
      </motion.svg>
      <LogoIdeogram className="absolute inset-0 m-auto h-11 w-11 text-current" />
    </div>
  );
}

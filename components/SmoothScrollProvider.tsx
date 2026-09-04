"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return; // skip entirely, respect the setting

    const lenis = new Lenis({
      duration: 1.4, // higher = slower/more gliding deceleration; tune by eye, try 1.2–1.8
      wheelMultiplier: 0.7, // lower = less scroll distance per wheel/trackpad tick; try 0.5–0.8
      touchMultiplier: 0.9, // similar, for touch/trackpad gestures
      smoothWheel: true,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard easeOutExpo-ish curve
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Lenis keeps re-applying its own scroll target every frame, which fights
    // a plain window.scrollTo(0, 0) after a route change — reset it here instead.
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}

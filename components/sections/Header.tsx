"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { nav } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { LogoWordmark } from "@/components/ui/Logo";

const HIDE_THRESHOLD = 80;

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [textTheme, setTextTheme] = useState<"ink" | "cream">("cream");
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const themedSections = useRef<{ el: Element; theme: "ink" | "cream" }[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    themedSections.current = Array.from(document.querySelectorAll("[data-header-text]")).map(
      (el) => ({ el, theme: el.getAttribute("data-header-text") as "ink" | "cream" })
    );
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (y < HIDE_THRESHOLD) {
        setHidden(false);
      } else if (y > lastScrollY.current) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;

      const refY = headerRef.current ? headerRef.current.offsetHeight / 2 : 44;
      const match = themedSections.current.find(({ el }) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= refY && rect.bottom > refY;
      });
      if (match) setTextTheme(match.theme);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const translateClass = hidden && !open ? "-translate-y-full" : "translate-y-0";
  const transitionClass = reduceMotion ? "" : "transition-transform duration-[250ms] ease-out";
  const themeClass = textTheme === "cream" ? "text-cream-text" : "text-ink";

  return (
    <header ref={headerRef} className={`fixed inset-x-0 top-0 z-50 ${transitionClass} ${translateClass}`}>
      <div className="mx-auto max-w-7xl py-4">
        <div className="flex items-center justify-between px-6 py-3 md:px-10">
          <Link
            href="/"
            aria-label="Wonder — home"
            className={`transition-colors duration-300 ${themeClass}`}
          >
            <LogoWordmark className="h-8 w-auto md:h-9" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-medium uppercase tracking-[0.1em] transition-colors duration-300 hover:text-olive ${themeClass}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button href="/book">Book Now</Button>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`p-1 transition-colors duration-300 lg:hidden ${themeClass}`}
          >
            <Menu size={24} className={open ? "hidden" : "block"} />
            <X size={24} className={open ? "block" : "hidden"} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ top: headerHeight, height: `calc(100dvh - ${headerHeight}px)` }}
            className="fixed inset-x-0 bottom-0 z-40 flex flex-col justify-between bg-cream px-6 py-10 lg:hidden"
          >
            <nav className="flex flex-col gap-6">
              {nav.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-3xl font-medium uppercase tracking-tight text-ink"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <Button href="/book" onClick={() => setOpen(false)} className="w-full">
              Book Now
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

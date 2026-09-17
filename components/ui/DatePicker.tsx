"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  isDateDisabled?: (iso: string) => boolean;
  placeholder?: string;
  className?: string;
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function DatePicker({
  id,
  value,
  onChange,
  min,
  isDateDisabled,
  placeholder = "Select a date",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const minDate = min ? parseISO(min) : null;
  const selectedDate = value ? parseISO(value) : null;

  const [viewDate, setViewDate] = useState(() => selectedDate ?? minDate ?? new Date());

  useEffect(() => {
    if (open) setViewDate(selectedDate ?? minDate ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : placeholder;

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  const isDisabled = (d: Date) => Boolean((minDate && d < minDate) || isDateDisabled?.(toISO(d)));
  const isSelected = (d: Date) => Boolean(selectedDate && sameDay(d, selectedDate));
  const isToday = (d: Date) => sameDay(d, new Date());

  const canGoPrevMonth =
    !minDate ||
    viewDate.getFullYear() > minDate.getFullYear() ||
    (viewDate.getFullYear() === minDate.getFullYear() && viewDate.getMonth() > minDate.getMonth());

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between border border-ink/15 bg-cream px-4 py-3 text-left text-sm transition-colors"
      >
        <span className={selectedDate ? "text-ink" : "text-muted"}>{label}</span>
        <Calendar size={16} className="shrink-0 text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-20 mt-1 w-[280px] border border-ink/15 bg-cream p-4 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                disabled={!canGoPrevMonth}
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-olive"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.04em] text-muted">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((d, i) =>
                d ? (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabled(d)}
                    onClick={() => {
                      onChange(toISO(d));
                      setOpen(false);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors disabled:pointer-events-none disabled:text-muted-light ${
                      isSelected(d)
                        ? "bg-olive text-cream-text"
                        : isToday(d)
                          ? "border border-olive text-ink"
                          : "text-ink hover:bg-cream-2"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <span key={i} />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

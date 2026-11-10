"use client";

import { hotDeskSeatTypes, spaces } from "@/lib/content";
import { SpaceSlider } from "@/components/ui/SpaceSlider";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

/**
 * Shows every space (labelled) until one is chosen, then only that space's photos.
 * For Hot Desks, picking a seat type narrows it further to that seat type's photos.
 */
export function BookingImagePanel({
  spaceKey,
  seatTypeKey = "",
  className = "",
}: {
  spaceKey: string;
  seatTypeKey?: string;
  className?: string;
}) {
  const selected = spaces.items.find((s) => s.key === spaceKey);
  const seatType =
    spaceKey === "hot-desks" ? hotDeskSeatTypes.find((t) => t.value === seatTypeKey) : undefined;

  return (
    <div className={`relative overflow-hidden bg-cream-2 ${className}`}>
      {selected && seatType ? (
        <SpaceSlider
          key={`${selected.key}:${seatType.value}`}
          images={seatType.images}
          alt={`${selected.heading}: ${seatType.label}`}
          captions={[`${selected.nav} · ${seatType.label}`]}
          sizes={SIZES}
        />
      ) : selected ? (
        <SpaceSlider
          key={selected.key}
          images={selected.images}
          alt={selected.heading}
          captions={[selected.nav]}
          sizes={SIZES}
        />
      ) : (
        <SpaceSlider
          key="all"
          images={spaces.items.map((s) => s.images[0])}
          alt="Wonder spaces"
          captions={spaces.items.map((s) => s.nav)}
          sizes={SIZES}
          priority
        />
      )}
    </div>
  );
}

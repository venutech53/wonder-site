"use client";

import { spaces } from "@/lib/content";
import { SpaceSlider } from "@/components/ui/SpaceSlider";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

/**
 * Shows every space (labelled) until one is chosen, then only that space's photos.
 */
export function BookingImagePanel({ spaceKey, className = "" }: { spaceKey: string; className?: string }) {
  const selected = spaces.items.find((s) => s.key === spaceKey);

  return (
    <div className={`relative overflow-hidden bg-cream-2 ${className}`}>
      {selected ? (
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

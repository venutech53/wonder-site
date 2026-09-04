import { findUs } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { paperTexture } from "@/lib/texture";

const marqueeItems = [
  { src: findUs.images.large, alt: "Lounge corner at Wonder", size: "large" as const },
  { src: findUs.images.small1, alt: "Coffee at Wonder", size: "small" as const },
  { src: findUs.images.small2, alt: "Workspace detail at Wonder", size: "small" as const },
  { src: findUs.images.large, alt: "Lounge corner at Wonder", size: "large" as const },
  { src: findUs.images.small1, alt: "Coffee at Wonder", size: "small" as const },
  { src: findUs.images.small2, alt: "Workspace detail at Wonder", size: "small" as const },
];

export function FindUs() {
  return (
    <section
      id="find-us"
      data-header-text="ink"
      style={paperTexture("#f2f0e4")}
      className="py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:justify-between lg:gap-16">
          <Reveal className="flex flex-col justify-between">
            <h2 className="text-[32px] font-bold uppercase leading-[1.1] text-ink md:text-[40px]">
              {findUs.headingLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <div className="mt-6 flex flex-col gap-1">
              <p className="text-base leading-relaxed text-muted">{findUs.hours}</p>
              <p className="text-base leading-relaxed text-muted">
                {findUs.email} · {findUs.phone}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex max-w-md flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <p className="whitespace-nowrap font-script text-[22px] text-olive md:text-[26px]">
                {findUs.script}
              </p>
              <p className="text-base leading-relaxed text-muted">{findUs.support}</p>
            </div>
            <Button
              href={`https://maps.google.com/?q=${encodeURIComponent(findUs.address)}`}
              variant="outline"
              className="w-fit"
            >
              {findUs.cta}
            </Button>
          </Reveal>
        </div>
      </div>

      <div className="mt-24 md:mt-32">
        <Marquee items={marqueeItems} durationSeconds={48} />
      </div>
    </section>
  );
}

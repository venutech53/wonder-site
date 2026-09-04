"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf, Users, MapPin, RefreshCw, type LucideIcon } from "lucide-react";
import { whyUs } from "@/lib/content";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { Reveal } from "@/components/ui/Reveal";

const icons: Record<string, LucideIcon> = {
  leaf: Leaf,
  users: Users,
  "map-pin": MapPin,
  "refresh-cw": RefreshCw,
};

export function WhyUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="why-us"
      data-header-text="cream"
      className="relative overflow-hidden bg-olive py-24 md:py-32"
    >
      <Image
        src="/images/whyus-texture.jpg"
        alt=""
        fill
        sizes="100vw"
        priority={false}
        className="object-cover"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:px-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <Reveal>
            <SectionHeading
              eyebrow={whyUs.eyebrow}
              heading={whyUs.heading}
              intro={whyUs.intro}
              tone="cream"
            />
          </Reveal>

          <ul className="flex flex-col">
            {whyUs.items.map((item, i) => {
              const Icon = icons[item.icon];
              return (
                <motion.li
                  key={item.title}
                  className={`flex gap-4 py-5 ${i > 0 ? "border-t border-cream-text/15" : ""}`}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 32 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-cream-text" strokeWidth={1.5} />
                  <div>
                    <h3 className="mb-1 text-base font-bold uppercase tracking-wide text-cream-text">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-cream-text/80">{item.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <ImageSlider images={whyUs.slides} alt="Wonder co-working space" className="h-[50vh] lg:h-[70vh]" />
      </div>
    </section>
  );
}

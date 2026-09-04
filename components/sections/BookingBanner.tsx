import { Slideshow } from "@/components/ui/Slideshow";
import { spaces } from "@/lib/content";
import { paperTexture } from "@/lib/texture";

export function BookingBanner() {
  const slides = spaces.items.map((item) => ({
    src: item.image,
    alt: item.heading,
    caption: item.nav,
  }));

  return (
    <section data-header-text="ink" style={paperTexture("#f2f0e4")} className="pt-[106px]">
      <Slideshow slides={slides} />
    </section>
  );
}

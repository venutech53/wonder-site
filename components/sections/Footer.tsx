import Image from "next/image";
import Link from "next/link";
import { footer, nav, poweredBy } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { LogoIdeogram } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { paperTexture } from "@/lib/texture";

export function Footer() {
  return (
    <footer data-header-text="cream" style={paperTexture("#1d1f1d", "soft-light")}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative h-[360px] lg:h-auto">
          <Image
            src={footer.image}
            alt="Interior corner at Wonder"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-between gap-16 px-6 py-16 md:px-10 md:py-20">
          <div className="flex items-start justify-between gap-8">
            <LogoIdeogram className="h-[60px] w-auto text-cream-text" />
            <nav className="flex flex-col items-end gap-3 text-right">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs font-medium uppercase tracking-[0.1em] text-cream-text/80 transition-colors hover:text-cream-text"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Reveal className="flex flex-col gap-6">
            <p className="font-script text-[32px] leading-tight text-cream-text md:text-[40px]">
              {footer.script}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-cream-text/70">
              {footer.ctaBody}
            </p>
            <Button href="/book" className="w-fit">
              {footer.ctaButton}
            </Button>
          </Reveal>

          <div className="flex flex-col gap-1 text-sm text-cream-text/70">
            <span>{footer.address}</span>
            <span>
              {footer.email} · {footer.phone}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-cream-text/15 px-6 py-6 text-xs text-cream-text/60 md:flex-row md:items-center md:justify-between md:px-10">
        <span>{footer.copyright}</span>
        <span>
          {footer.site} · {poweredBy.prefix}
          <a
            href={poweredBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition-colors hover:text-olive hover:underline"
          >
            {poweredBy.name}
          </a>
        </span>
      </div>
    </footer>
  );
}

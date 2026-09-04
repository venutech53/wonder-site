import { Eyebrow } from "./Eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  heading: string;
  intro?: string;
  tone?: "ink" | "cream";
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  heading,
  intro,
  tone = "ink",
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  const headingTone = tone === "cream" ? "text-cream-text" : "text-ink";
  const introTone = tone === "cream" ? "text-cream-text/80" : "text-muted";

  return (
    <div className={`flex flex-col gap-4 ${alignClass} ${className}`}>
      {eyebrow && <Eyebrow tone={tone === "cream" ? "cream" : "ink"}>{eyebrow}</Eyebrow>}
      <h2
        className={`text-[32px] md:text-[40px] font-bold uppercase leading-[1.1] ${headingTone}`}
      >
        {heading}
      </h2>
      {intro && <p className={`max-w-md text-base leading-relaxed ${introTone}`}>{intro}</p>}
    </div>
  );
}

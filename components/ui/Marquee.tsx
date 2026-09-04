import Image from "next/image";

type MarqueeItem = {
  src: string;
  alt: string;
  size: "large" | "small";
};

type MarqueeProps = {
  items: MarqueeItem[];
  durationSeconds?: number;
  className?: string;
  rounded?: boolean;
};

export function Marquee({
  items,
  durationSeconds = 50,
  className = "",
  rounded = true,
}: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="marquee-track flex w-max gap-6"
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
        tabIndex={0}
      >
        {track.map((item, i) => (
          <div
            key={`${item.src}-${i}`}
            className={`relative h-[280px] flex-shrink-0 overflow-hidden md:h-[380px] ${
              rounded ? "rounded-xl" : ""
            } ${item.size === "large" ? "w-[420px] md:w-[560px]" : "w-[260px] md:w-[340px]"}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(min-width: 768px) 560px, 420px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type EyebrowProps = {
  children: React.ReactNode;
  tone?: "ink" | "cream" | "muted";
  className?: string;
};

const tones = {
  ink: "text-ink",
  cream: "text-cream-text",
  muted: "text-muted",
};

export function Eyebrow({ children, tone = "ink", className = "" }: EyebrowProps) {
  return (
    <span
      className={`block text-[11px] md:text-xs font-medium uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

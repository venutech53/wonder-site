import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = {
  href?: string;
  variant?: "primary" | "outline";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children" | "onClick">;

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase text-[13px] tracking-[0.05em] font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary: "rounded-full bg-olive px-6 py-3 text-cream-text hover:bg-olive-light",
  outline:
    "rounded-full border border-ink px-6 py-3 text-ink hover:bg-olive hover:text-cream-text hover:border-olive",
};

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  onClick,
  ...props
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
        {variant === "outline" && <ArrowRight size={15} strokeWidth={2} />}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...props}>
      {children}
      {variant === "outline" && <ArrowRight size={15} strokeWidth={2} />}
    </button>
  );
}

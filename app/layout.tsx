import type { Metadata } from "next";
import { roboto, homemadeApple } from "@/lib/fonts";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wonder — Co-working in Colombo 05",
  description:
    "A dedicated coworking space in Colombo 05 with private offices, meeting rooms and hot desks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${homemadeApple.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}

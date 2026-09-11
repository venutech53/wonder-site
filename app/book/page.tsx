import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SpacesGallery } from "@/components/sections/SpacesGallery";
import { BookingForm } from "@/components/sections/BookingForm";
import { spaces } from "@/lib/content";

export const metadata: Metadata = {
  title: "Book Your Space — Wonder",
  description: "Book a hot desk, solo pod, board room, or conversation room at Wonder, Colombo 05.",
};

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const params = await searchParams;
  const requestedSpace = typeof params.space === "string" ? params.space : undefined;
  const initialSpace = spaces.items.some((s) => s.key === requestedSpace)
    ? requestedSpace
    : undefined;

  return (
    <>
      <Header />
      <main className="flex-1">
        <SpacesGallery />
        <BookingForm initialSpace={initialSpace} />
      </main>
      <Footer />
    </>
  );
}

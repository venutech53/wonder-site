import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SpacesSection } from "@/components/sections/SpacesSection";

export const metadata: Metadata = {
  title: "Our Spaces — Wonder",
  description: "Hot desks, solo pods, a board room, and a conversation room at Wonder, Colombo 05.",
};

export default function SpacesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <SpacesSection />
      </main>
      <Footer />
    </>
  );
}

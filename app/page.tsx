import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { ScrollStatement } from "@/components/sections/ScrollStatement";
import { WhyUs } from "@/components/sections/WhyUs";
import { FindUs } from "@/components/sections/FindUs";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ScrollStatement />
        <WhyUs />
        <FindUs />
      </main>
      <Footer />
    </>
  );
}

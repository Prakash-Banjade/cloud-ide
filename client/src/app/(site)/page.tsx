import CodingPagePreview from "@/components/landing-page/coding-page-preview";
import Features from "@/components/landing-page/features";
import Hero from "@/components/landing-page/hero";
import Pricing from "@/components/landing-page/pricing";

export default function Home() {
  return (
    <>
      <Hero />
      <CodingPagePreview />
      <Features />
      <Pricing />
    </>
  );
}

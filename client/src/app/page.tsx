import CodingPagePreview from "@/components/landing-page/coding-page-preview";
import Features from "@/components/landing-page/features";
import Hero from "@/components/landing-page/hero";
import Navbar from "@/components/landing-page/navbar";
import Pricing from "@/components/landing-page/pricing";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Hero />
        <CodingPagePreview />
        <Features />
        <Pricing />
      </div>
      <Footer />
    </div>
  );
}

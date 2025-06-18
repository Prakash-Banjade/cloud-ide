import Features from "@/components/landing-page/features";
import Hero from "@/components/landing-page/hero";
import HeroGetStartedButton from "@/components/landing-page/hero-get-started-btn";
import Navbar from "@/components/landing-page/navbar";
import Pricing from "@/components/landing-page/pricing";
import Footer from "@/components/layout/footer";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Hero>
          <Suspense>
            <HeroGetStartedButton />
          </Suspense>
        </Hero>
        <Features />
        <Pricing />
      </div>
      <Footer />
    </div>
  );
}

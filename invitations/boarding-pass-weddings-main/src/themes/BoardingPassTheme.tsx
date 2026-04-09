import { useState } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/boarding-pass/LanguageToggle";
import SplashScreen from "@/components/boarding-pass/SplashScreen";
import HeroSection from "@/components/boarding-pass/HeroSection";
import CountdownSection from "@/components/boarding-pass/CountdownSection";
import OurStorySection from "@/components/boarding-pass/OurStorySection";
import EventDetailsSection from "@/components/boarding-pass/EventDetailsSection";
import RSVPSection from "@/components/boarding-pass/RSVPSection";
import GallerySection from "@/components/boarding-pass/GallerySection";
import FooterSection from "@/components/boarding-pass/FooterSection";

const BoardingPassTheme = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <LanguageProvider>
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}
      <LanguageToggle />
      <main className="bg-background text-foreground overflow-x-hidden">
        <HeroSection />
        <CountdownSection />
        <OurStorySection />
        <EventDetailsSection />
        <RSVPSection />
        <GallerySection />
        <FooterSection />
      </main>
    </LanguageProvider>
  );
};

export default BoardingPassTheme;

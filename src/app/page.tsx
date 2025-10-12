import Navigation from "@/components/Navigation";
import Hero from "@/components/landingPageUi/Hero";
import ImpactNumbers from "@/components/landingPageUi/ImpactNumbers";
import Partners from "@/components/landingPageUi/Partners";
import Footer from "@/components/landingPageUi/Footer";
import UpcomingEvents from "@/components/landingPageUi/UpcomingEvents";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/i18n/messages";
import { VideoText } from "@/components/landingPageUi/videotext";
import ScrollRevealWrapper from "@/components/landingPageUi/ScrollRevealWrapper";

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as Lang | undefined;
  const lang: Lang = cookieLang === "ar" ? "ar" : "en";
  const m = messages[lang] ?? messages.en;

  return (
    <ScrollRevealWrapper>
      <Navigation />
      <div className="relative h-screen w-[80%] overflow-hidden mx-auto">
        <VideoText src="/5180_Wind_Turbine_Wind_Turbines_1920x1080.mp4">
          Energy Hub
        </VideoText>
      </div>
      <Hero />
      <ImpactNumbers />
      <UpcomingEvents />
      <Partners />
      <Footer />
    </ScrollRevealWrapper>
  );
}
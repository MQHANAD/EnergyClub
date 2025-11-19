import Navigation from "@/components/Navigation";
import Hero from "@/components/landingPageUi/Hero";
import ImpactNumbers from "@/components/landingPageUi/ImpactNumbers";
import Partners from "@/components/landingPageUi/Partners";
import Footer from "@/components/landingPageUi/Footer";
import UpcomingEvents from "@/components/landingPageUi/UpcomingEvents";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/i18n/messages";
import { getDirFromLang } from "@/i18n/messages";
import { VideoText } from "@/components/landingPageUi/videotext";
import ScrollRevealWrapper from "@/components/landingPageUi/ScrollRevealWrapper";

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as Lang | undefined;
  const lang: Lang = cookieLang === "ar" ? "ar" : "en";
  const m = messages[lang] ?? messages.en;
  const heroTitle = m.hero.titleEnergyHub;
  return (
    <div dir={getDirFromLang(lang)}>
      <Navigation />
      <ScrollRevealWrapper>
        <div className="relative md:h-[100vh] h-[55dvh] w-[80%] overflow-hidden mx-auto pt-20 mt-1">
          <VideoText src="https://firebasestorage.googleapis.com/v0/b/university-club-platform.firebasestorage.app/o/5180_Wind_Turbine_Wind_Turbines_1920x1080.mp4?alt=media&token=86106837-780e-4ce9-a9bc-06ca30dc0d92">
            {heroTitle}
          </VideoText>
        </div>
        {/* <div className="glow-divider glow-divider-animate"></div> */}
        <Hero />
        <ImpactNumbers />
        <UpcomingEvents />
        {/* <Partners /> */}
        <Footer />
      </ScrollRevealWrapper>
    </div>
  );
}

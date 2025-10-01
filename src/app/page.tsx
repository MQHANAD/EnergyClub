import Navigation from "@/components/Navigation";
import Hero from "@/components/landingPageUi/Hero";
import ImpactNumbers from "@/components/landingPageUi/ImpactNumbers";
import Partners from "@/components/landingPageUi/Partners";
import Footer from "@/components/landingPageUi/Footer";
import UpcomingEvents from "@/components/landingPageUi/UpcomingEvents";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/i18n/messages";

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as Lang | undefined;
  const lang: Lang = cookieLang === "ar" ? "ar" : "en";
  const m = messages[lang] ?? messages.en;

  return (
    <main className="bg-white text-gray-900">
      <Navigation />
      <Hero />

      <ImpactNumbers />
      <UpcomingEvents />
      {/* <Partners /> */}
      <Footer />
    </main>
  );
}

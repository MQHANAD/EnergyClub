import Navigation from "@/components/Navigation";
import Hero from "@/components/landingPageUi/Hero";
import ImpactNumbers from "@/components/landingPageUi/ImpactNumbers";
import Partners from "@/components/landingPageUi/Partners";
import Events from "@/components/landingPageUi/Events";
import Footer from "@/components/landingPageUi/Footer";
import UpcomingEvents from "@/components/landingPageUi/UpcomingEvents";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/i18n/messages";

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as Lang | undefined;
  const lang: Lang = cookieLang === "ar" ? "ar" : "en";
  const m = messages[lang] ?? messages.en;

  const dummyEvents = [
    {
      id: "energy-week",
      title: m.events.items.energyWeek.title,
      short: m.events.items.energyWeek.short,
      content: <p>{m.events.items.energyWeek.content}</p>,
      images: [
        "/ev1/p1.jpg",
        "/ev1/p2.jpg",
        "/ev1/p3.jpg",
        "/ev1/p4.jpg",
        "/ev1/p5.jpg",
        "/ev1/p6.jpg",
        "/ev1/p7.jpg",
        "/ev1/p8.jpg",
        "/ev1/p9.jpg",
        "/ev1/p10.jpg",
      ],
    },
    {
      id: "shark-tank",
      title: m.events.items.sharkTank.title,
      short: m.events.items.sharkTank.short,
      content: <p>{m.events.items.sharkTank.content}</p>,
      images: [
        "/ev2/p1.JPG",
        "/ev2/p2.JPG",
        "/ev2/p3.JPG",
        "/ev2/p4.JPG",
        "/ev2/p5.JPG",
        "/ev2/p6.JPG",
      ],
    },
    {
      id: "green-h2",
      title: m.events.items.greenH2.title,
      short: m.events.items.greenH2.short,
      content: <p>{m.events.items.greenH2.content}</p>,
      images: ["/ev3/P1.png", "/ev3/P3.svg", "/ev3/p5.png"],
    },
  ];

  return (
    <main className="bg-white text-gray-900">
      <Navigation />
      <Hero />

      <ImpactNumbers />
      <UpcomingEvents />
      <Events events={dummyEvents} title={m.events.title} showButtons={true} />
      {/* <Partners /> */}
      <Footer />
    </main>
  );
}

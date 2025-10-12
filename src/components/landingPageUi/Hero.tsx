"use client";
import { useI18n } from "@/i18n/index";
import { TextReveal } from "./textReveal";

export default function Hero() {
  const { t } = useI18n();

  return (
    <section
      id="home"
      className="bg-white"
    >
      <TextReveal className="bg-white">
        {t("hero.tagline")}
      </TextReveal>
    </section>
  );
}

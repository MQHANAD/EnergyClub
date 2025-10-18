"use client";
import { useI18n } from "@/i18n/index";
import { TextReveal } from "./textReveal";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Hero() {
  const { t } = useI18n();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section id="home" className="bg-white pt-16 md:pt-24 py-20">
      <div ref={ref} className="bg-white">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-light text-gray-900 mb-8 text-center"
        >
          {t("hero.titleEnergyHub")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#25818a10] px-16 py-12 text-black-700 text-center max-w-5xl mx-auto text-xl font-light rounded-3xl border border-gray-200"
        >
          {t("hero.tagline")}
        </motion.p>
      </div>
    </section>
  );
}

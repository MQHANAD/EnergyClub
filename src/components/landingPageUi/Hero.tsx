"use client";
import { useI18n } from "@/i18n/index";
import { TextReveal } from "./textReveal";
import { motion, type Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Hero() {
  const { t, dir } = useI18n();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="about" dir={dir} className="bg-[#25818a] md:py-36 py-16">
      <div
        ref={ref}
        className="md:mx-16 flex max-w-8xl flex-col items-start justify-center px-4 md:px-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-white mb-6 w-70 md:w-80"
        >
          {t("hero.titleEnergyHub")}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="mt-6 text-balance text-base leading-relaxed text-white sm:text-lg md:text-xl"
        >
          {t("hero.tagline")}
        </motion.p>
      </div>
    </section>
  );
}
